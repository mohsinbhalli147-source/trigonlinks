import { google } from 'googleapis';
import { googleOAuthService } from './google-oauth';
import { getSupabaseClient } from '../database/client';
import { logger } from '../utils/logger';

const supabase = getSupabaseClient();

interface ContactData {
  name: {
    givenName: string;
    familyName: string;
  };
  phoneNumbers?: Array<{ value: string; type: string }>;
  emailAddresses?: Array<{ value: string; type: string }>;
  addresses?: Array<{ streetAddress: string; city: string; region: string; postalCode: string }>;
  organizations?: Array<{ name: string; title: string }>;
  notes?: string;
}

interface CustomerData {
  id: number;
  uid: string;
  name: string;
  fatherName?: string;
  username?: string;
  mobile: string;
  email?: string;
  address?: string;
  area?: string;
  package?: string;
  status: string;
  install_date?: number;
  billing_date?: number;
  fee?: number;
  notes?: string;
}

class GoogleContactsService {
  /**
   * Create a Google Contact from customer data
   */
  private formatCustomerToContact(customer: CustomerData): ContactData {
    const contact: ContactData = {
      name: {
        givenName: customer.name.split(' ')[0] || customer.name,
        familyName: customer.name.split(' ').slice(1).join(' ') || ''
      }
    };

    // Add phone number
    if (customer.mobile) {
      contact.phoneNumbers = [{ value: customer.mobile, type: 'mobile' }];
    }

    // Add email
    if (customer.email) {
      contact.emailAddresses = [{ value: customer.email, type: 'home' }];
    }

    // Add address
    if (customer.address) {
      contact.addresses = [{ streetAddress: customer.address, city: customer.area || '', region: '', postalCode: '' }];
    }

    // Add organization
    contact.organizations = [
      {
        name: 'TRIGONLINKS ERP',
        title: customer.package || 'Customer'
      }
    ];

    // Build notes with customer details
    const notesParts = [
      `Customer ID: ${customer.uid}`,
      `Area: ${customer.area || 'N/A'}`,
      `Package: ${customer.package || 'N/A'}`,
      `Status: ${customer.status}`,
      `Monthly Fee: Rs. ${customer.fee || 0}`,
      `Installation Date: ${customer.install_date ? new Date(customer.install_date).toLocaleDateString() : 'N/A'}`,
      `Billing Date: ${customer.billing_date || 'N/A'}`
    ];

    if (customer.notes) {
      notesParts.push(`Notes: ${customer.notes}`);
    }

    contact.notes = notesParts.join('\n');

    return contact;
  }

  /**
   * Create a new Google Contact
   */
  async createContact(userId: number, customer: CustomerData): Promise<string | null> {
    try {
      const accessToken = await googleOAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('Not authenticated with Google');
      }

      const peopleService = google.people({
        version: 'v1',
        auth: accessToken
      });
      const contactData = this.formatCustomerToContact(customer);

      const { data } = await peopleService.people.createContact({
        requestBody: {
          names: [contactData.name],
          phoneNumbers: contactData.phoneNumbers,
          emailAddresses: contactData.emailAddresses,
          addresses: contactData.addresses,
          organizations: contactData.organizations,
          biographies: contactData.notes ? [{ value: contactData.notes, contentType: 'TEXT_PLAIN' }] : undefined
        }
      });

      const contactId = data.resourceName?.replace('people/', '') || null;

      // Store sync record
      if (contactId) {
        await this.storeSyncRecord(customer.id, contactId, data.etag || '', 'synced');
      }

      logger.info(`Created Google contact for customer ${customer.id}`);
      return contactId;
    } catch (error) {
      logger.error(`Error creating Google contact for customer ${customer.id}:`, error);
      await this.storeSyncRecord(customer.id, null, '', 'failed', String(error));
      return null;
    }
  }

  /**
   * Update an existing Google Contact
   */
  async updateContact(userId: number, customer: CustomerData, googleContactId: string): Promise<boolean> {
    try {
      const accessToken = await googleOAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('Not authenticated with Google');
      }

      const peopleService = google.people({
        version: 'v1',
        auth: accessToken
      });
      const contactData = this.formatCustomerToContact(customer);

      // First, get the existing contact to preserve etag
      const { data: existingContact } = await peopleService.people.get({
        resourceName: `people/${googleContactId}`,
        personFields: 'etag,names,phoneNumbers,emailAddresses,addresses,organizations,biographies'
      });

      const { data } = await peopleService.people.updateContact({
        resourceName: `people/${googleContactId}`,
        updatePersonFields: 'names,phoneNumbers,emailAddresses,addresses,organizations,biographies',
        requestBody: {
          etag: existingContact.etag,
          names: [contactData.name],
          phoneNumbers: contactData.phoneNumbers,
          emailAddresses: contactData.emailAddresses,
          addresses: contactData.addresses,
          organizations: contactData.organizations,
          biographies: contactData.notes ? [{ value: contactData.notes, contentType: 'TEXT_PLAIN' }] : undefined
        }
      });

      // Update sync record
      await this.updateSyncRecord(customer.id, data.etag || '', 'synced');

      logger.info(`Updated Google contact for customer ${customer.id}`);
      return true;
    } catch (error) {
      logger.error(`Error updating Google contact for customer ${customer.id}:`, error);
      await this.updateSyncRecord(customer.id, '', 'failed', String(error));
      return false;
    }
  }

  /**
   * Delete or archive a Google Contact
   */
  async deleteContact(userId: number, googleContactId: string): Promise<boolean> {
    try {
      const accessToken = await googleOAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('Not authenticated with Google');
      }

      const peopleService = google.people({
        version: 'v1',
        auth: accessToken
      });

      // Archive instead of delete (safer)
      await peopleService.people.updateContact({
        resourceName: `people/${googleContactId}`,
        updatePersonFields: 'metadata',
        requestBody: {
          metadata: {
            deleted: true
          }
        }
      });

      logger.info(`Archived Google contact ${googleContactId}`);
      return true;
    } catch (error) {
      logger.error(`Error archiving Google contact ${googleContactId}:`, error);
      return false;
    }
  }

  /**
   * Search for existing contact by phone or email
   */
  async findExistingContact(userId: number, phone?: string, email?: string): Promise<string | null> {
    try {
      const accessToken = await googleOAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        return null;
      }

      const peopleService = google.people({
        version: 'v1',
        auth: accessToken
      });

      // Search by phone
      if (phone) {
        const { data: phoneResults } = await peopleService.people.searchContacts({
          query: phone,
          readMask: 'names,phoneNumbers,emailAddresses'
        });

        if (phoneResults.results && phoneResults.results.length > 0) {
          const contactId = phoneResults.results[0].person?.resourceName?.replace('people/', '');
          if (contactId) {
            return contactId;
          }
        }
      }

      // Search by email
      if (email) {
        const { data: emailResults } = await peopleService.people.searchContacts({
          query: email,
          readMask: 'names,phoneNumbers,emailAddresses'
        });

        if (emailResults.results && emailResults.results.length > 0) {
          const contactId = emailResults.results[0].person?.resourceName?.replace('people/', '');
          if (contactId) {
            return contactId;
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Error finding existing contact:', error);
      return null;
    }
  }

  /**
   * Store sync record in database
   */
  private async storeSyncRecord(
    customerId: number,
    googleContactId: string | null,
    googleResourceId: string,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      const { error: dbError } = await supabase.from('google_contacts_sync').upsert({
        customer_id: customerId,
        google_contact_id: googleContactId,
        google_resource_id: googleResourceId,
        sync_status: status,
        sync_error: error || null,
        last_sync_at: Date.now(),
        retry_count: 0,
        updated_at: Date.now()
      }, {
        onConflict: 'customer_id'
      });

      if (dbError) throw dbError;
    } catch (error) {
      logger.error('Error storing sync record:', error);
    }
  }

  /**
   * Update existing sync record
   */
  private async updateSyncRecord(
    customerId: number,
    googleResourceId: string,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      const { error: dbError } = await supabase
        .from('google_contacts_sync')
        .update({
          google_resource_id: googleResourceId,
          sync_status: status,
          sync_error: error || null,
          last_sync_at: Date.now(),
          updated_at: Date.now()
        })
        .eq('customer_id', customerId);

      if (dbError) throw dbError;
    } catch (error) {
      logger.error('Error updating sync record:', error);
    }
  }

  /**
   * Get sync status for a customer
   */
  async getSyncStatus(customerId: number): Promise<{ synced: boolean; googleContactId: string | null; lastSync: number | null }> {
    try {
      const { data, error } = await supabase
        .from('google_contacts_sync')
        .select('google_contact_id, last_sync_at, sync_status')
        .eq('customer_id', customerId)
        .limit(1)
        .single();

      if (error || !data) {
        return { synced: false, googleContactId: null, lastSync: null };
      }

      return {
        synced: data.sync_status === 'synced',
        googleContactId: data.google_contact_id,
        lastSync: data.last_sync_at
      };
    } catch (error) {
      logger.error('Error getting sync status:', error);
      return { synced: false, googleContactId: null, lastSync: null };
    }
  }

  /**
   * Get overall sync statistics
   */
  async getSyncStatistics(userId: number): Promise<{
    totalSynced: number;
    pendingSync: number;
    failedSync: number;
    lastSyncTime: number | null;
  }> {
    try {
      const { data: syncedData } = await supabase
        .from('google_contacts_sync')
        .select('id', { count: 'exact' })
        .eq('sync_status', 'synced');

      const { data: pendingData } = await supabase
        .from('google_contacts_sync')
        .select('id', { count: 'exact' })
        .eq('sync_status', 'pending');

      const { data: failedData } = await supabase
        .from('google_contacts_sync')
        .select('id', { count: 'exact' })
        .eq('sync_status', 'failed');

      const { data: lastSyncData } = await supabase
        .from('google_contacts_sync')
        .select('last_sync_at')
        .eq('sync_status', 'synced')
        .order('last_sync_at', { ascending: false })
        .limit(1);

      return {
        totalSynced: syncedData?.length || 0,
        pendingSync: pendingData?.length || 0,
        failedSync: failedData?.length || 0,
        lastSyncTime: lastSyncData?.[0]?.last_sync_at || null
      };
    } catch (error) {
      logger.error('Error getting sync statistics:', error);
      return { totalSynced: 0, pendingSync: 0, failedSync: 0, lastSyncTime: null };
    }
  }

  /**
   * Sync all existing customers to Google Contacts
   */
  async syncAllCustomers(userId: number): Promise<{ success: number; failed: number }> {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active');

      if (error || !customers) {
        throw error || new Error('No customers found');
      }

      let success = 0;
      let failed = 0;

      for (const customer of customers) {
        const syncStatus = await this.getSyncStatus(customer.id);

        if (syncStatus.synced && syncStatus.googleContactId) {
          // Update existing contact
          const updated = await this.updateContact(userId, customer, syncStatus.googleContactId);
          if (updated) success++;
          else failed++;
        } else {
          // Check for existing contact
          const existingContactId = await this.findExistingContact(userId, customer.mobile, customer.email);

          if (existingContactId) {
            // Link to existing contact and update
            const updated = await this.updateContact(userId, customer, existingContactId);
            if (updated) success++;
            else failed++;
          } else {
            // Create new contact
            const contactId = await this.createContact(userId, customer);
            if (contactId) success++;
            else failed++;
          }
        }
      }

      logger.info(`Synced ${success} customers, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      logger.error('Error syncing all customers:', error);
      return { success: 0, failed: 0 };
    }
  }
}

export const googleContactsService = new GoogleContactsService();
