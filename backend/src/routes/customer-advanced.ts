import express from 'express';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { CustomerTagsRepository } from '../repositories/CustomerTagsRepository';
import { CustomerLabelsRepository } from '../repositories/CustomerLabelsRepository';
import { CustomerDocumentsRepository } from '../repositories/CustomerDocumentsRepository';
import { CustomerNotesRepository } from '../repositories/CustomerNotesRepository';
import { StaffNotesRepository } from '../repositories/StaffNotesRepository';
import { FamilyAccountsRepository } from '../repositories/FamilyAccountsRepository';
import { CustomerActivityTimelineRepository } from '../repositories/CustomerActivityTimelineRepository';
import { SavedFiltersRepository } from '../repositories/SavedFiltersRepository';
import { BulkOperationsRepository } from '../repositories/BulkOperationsRepository';
import { CustomerPackageHistoryRepository } from '../repositories/CustomerPackageHistoryRepository';
import { CustomerConnectionHistoryRepository } from '../repositories/CustomerConnectionHistoryRepository';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { ConnectionsRepository } from '../repositories/ConnectionsRepository';
import { getSupabaseClient } from '../database/client';

const router = express.Router();
const supabase = getSupabaseClient();

// Initialize repositories
const tagsRepo = new CustomerTagsRepository();
const labelsRepo = new CustomerLabelsRepository();
const documentsRepo = new CustomerDocumentsRepository();
const notesRepo = new CustomerNotesRepository();
const staffNotesRepo = new StaffNotesRepository();
const familyAccountsRepo = new FamilyAccountsRepository();
const activityTimelineRepo = new CustomerActivityTimelineRepository();
const savedFiltersRepo = new SavedFiltersRepository();
const bulkOperationsRepo = new BulkOperationsRepository();
const packageHistoryRepo = new CustomerPackageHistoryRepository();
const connectionHistoryRepo = new CustomerConnectionHistoryRepository();
const customersRepo = new CustomersRepository();
const connectionsRepo = new ConnectionsRepository();

router.use(authenticate);

// ==================== CUSTOMER TAGS ====================

// Get tags for a customer
router.get('/tags/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const tags = await tagsRepo.findByCustomerId(customerId);
    res.json({ success: true, data: tags });
  } catch (error: any) {
    logger.error('Error fetching customer tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all unique tags
router.get('/tags/all', async (req: AuthRequest, res) => {
  try {
    const tags = await tagsRepo.getAllTags();
    res.json({ success: true, data: tags });
  } catch (error: any) {
    logger.error('Error fetching all tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add tag to customer
router.post('/tags', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_id, tag_name, tag_color } = req.body;
    
    const tag = await tagsRepo.upsertTag(
      customer_id,
      tag_name,
      tag_color || '#3B82F6',
      req.user?.id
    );
    
    // Log activity
    await activityTimelineRepo.logActivity(
      customer_id,
      'tag_added',
      `Tag "${tag_name}" added to customer`,
      null,
      { tag_name, tag_color },
      req.user?.id
    );
    
    res.json({ success: true, data: tag });
  } catch (error: any) {
    logger.error('Error adding customer tag:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove tag from customer
router.delete('/tags/:customerId/:tagName', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customerId, tagName } = req.params;
    await tagsRepo.deleteTag(customerId, tagName);
    
    // Log activity
    await activityTimelineRepo.logActivity(
      customerId,
      'tag_removed',
      `Tag "${tagName}" removed from customer`,
      null,
      { tag_name: tagName },
      req.user?.id
    );
    
    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (error: any) {
    logger.error('Error removing customer tag:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CUSTOMER LABELS ====================

// Get labels for a customer
router.get('/labels/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const labels = await labelsRepo.findByCustomerId(customerId);
    res.json({ success: true, data: labels });
  } catch (error: any) {
    logger.error('Error fetching customer labels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add label to customer
router.post('/labels', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_id, label_name, label_type, label_color } = req.body;
    
    const label = await labelsRepo.upsertLabel(
      customer_id,
      label_name,
      label_type,
      label_color || '#10B981',
      req.user?.id
    );
    
    // Log activity
    await activityTimelineRepo.logActivity(
      customer_id,
      'label_added',
      `Label "${label_name}" (${label_type}) added to customer`,
      null,
      { label_name, label_type, label_color },
      req.user?.id
    );
    
    res.json({ success: true, data: label });
  } catch (error: any) {
    logger.error('Error adding customer label:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove label from customer
router.delete('/labels/:customerId/:labelName/:labelType', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customerId, labelName, labelType } = req.params;
    await labelsRepo.deleteLabel(customerId, labelName, labelType);
    
    // Log activity
    await activityTimelineRepo.logActivity(
      customerId,
      'label_removed',
      `Label "${labelName}" (${labelType}) removed from customer`,
      null,
      { label_name: labelName, label_type: labelType },
      req.user?.id
    );
    
    res.json({ success: true, message: 'Label removed successfully' });
  } catch (error: any) {
    logger.error('Error removing customer label:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CUSTOMER RATING & PRIORITY ====================

// Update customer rating and priority
router.put('/rating-priority/:customerId', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const { rating, priority } = req.body;
    
    const updates: any = {};
    if (rating !== undefined) updates.rating = rating;
    if (priority !== undefined) updates.priority = priority;
    updates.updated_at = Date.now();
    
    const { data: customer, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log activity
    await activityTimelineRepo.logActivity(
      customerId,
      'rating_priority_updated',
      `Customer rating/priority updated`,
      null,
      { rating, priority },
      req.user?.id
    );
    
    res.json({ success: true, data: customer });
  } catch (error: any) {
    logger.error('Error updating customer rating/priority:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CUSTOMER DOCUMENTS ====================

// Get documents for a customer
router.get('/documents/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const documents = await documentsRepo.findByCustomerId(customerId);
    res.json({ success: true, data: documents });
  } catch (error: any) {
    logger.error('Error fetching customer documents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload document
router.post('/documents', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_id, document_type, document_name, file_url, file_size, file_type, description, is_public } = req.body;
    
    const document = await documentsRepo.createDocument({
      customer_id,
      document_type,
      document_name,
      file_url,
      file_size,
      file_type,
      description,
      is_public: is_public || false,
      uploaded_by: req.user?.id
    });
    
    // Log activity
    await activityTimelineRepo.logActivity(
      customer_id,
      'document_uploaded',
      `Document "${document_name}" uploaded`,
      null,
      { document_type, document_name, file_size },
      req.user?.id
    );
    
    res.json({ success: true, data: document });
  } catch (error: any) {
    logger.error('Error uploading document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete document
router.delete('/documents/:documentId', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.params;
    const document = await documentsRepo.findById(documentId);
    await documentsRepo.deleteDocument(documentId);
    
    // Log activity
    if (document) {
      await activityTimelineRepo.logActivity(
        document.customer_id,
        'document_deleted',
        `Document "${document.document_name}" deleted`,
        null,
        { document_name: document.document_name },
        req.user?.id
      );
    }
    
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CUSTOMER NOTES ====================

// Get notes for a customer
router.get('/notes/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const notes = await notesRepo.findByCustomerId(customerId);
    res.json({ success: true, data: notes });
  } catch (error: any) {
    logger.error('Error fetching customer notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add note
router.post('/notes', async (req: AuthRequest, res) => {
  try {
    const { customer_id, note_text, note_type, is_pinned } = req.body;
    
    const note = await notesRepo.createNote({
      customer_id,
      note_text,
      note_type: note_type || 'general',
      is_pinned: is_pinned || false,
      created_by: req.user?.id
    });
    
    // Log activity
    await activityTimelineRepo.logActivity(
      customer_id,
      'note_added',
      `Note added to customer`,
      note_text,
      { note_type, is_pinned },
      req.user?.id
    );
    
    res.json({ success: true, data: note });
  } catch (error: any) {
    logger.error('Error adding customer note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update note
router.put('/notes/:noteId', async (req: AuthRequest, res) => {
  try {
    const { noteId } = req.params;
    const { note_text, note_type, is_pinned } = req.body;
    
    const note = await notesRepo.updateNote(noteId, {
      note_text,
      note_type,
      is_pinned,
      updated_by: req.user?.id
    });
    
    res.json({ success: true, data: note });
  } catch (error: any) {
    logger.error('Error updating customer note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle pin note
router.put('/notes/:noteId/pin', async (req: AuthRequest, res) => {
  try {
    const { noteId } = req.params;
    const { is_pinned } = req.body;
    const note = await notesRepo.togglePin(noteId, is_pinned);
    res.json({ success: true, data: note });
  } catch (error: any) {
    logger.error('Error toggling note pin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete note
router.delete('/notes/:noteId', async (req: AuthRequest, res) => {
  try {
    const { noteId } = req.params;
    await notesRepo.deleteNote(noteId);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting customer note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== STAFF NOTES ====================

// Get staff notes for a customer
router.get('/staff-notes/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const notes = await staffNotesRepo.findByCustomerId(customerId);
    res.json({ success: true, data: notes });
  } catch (error: any) {
    logger.error('Error fetching staff notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add staff note
router.post('/staff-notes', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_id, note_text, note_category, is_sensitive, visible_to_roles } = req.body;
    
    const note = await staffNotesRepo.createNote({
      customer_id,
      note_text,
      note_category: note_category || 'internal',
      is_sensitive: is_sensitive || false,
      visible_to_roles: visible_to_roles || ['admin'],
      created_by: req.user?.id
    });
    
    // Log activity
    await activityTimelineRepo.logActivity(
      customer_id,
      'staff_note_added',
      `Staff note added (${note_category})`,
      null,
      { note_category, is_sensitive },
      req.user?.id
    );
    
    res.json({ success: true, data: note });
  } catch (error: any) {
    logger.error('Error adding staff note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update staff note
router.put('/staff-notes/:noteId', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { noteId } = req.params;
    const { note_text, note_category, is_sensitive, visible_to_roles } = req.body;
    
    const note = await staffNotesRepo.updateNote(noteId, {
      note_text,
      note_category,
      is_sensitive,
      visible_to_roles,
      updated_by: req.user?.id
    });
    
    res.json({ success: true, data: note });
  } catch (error: any) {
    logger.error('Error updating staff note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete staff note
router.delete('/staff-notes/:noteId', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { noteId } = req.params;
    await staffNotesRepo.deleteNote(noteId);
    res.json({ success: true, message: 'Staff note deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting staff note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== FAMILY ACCOUNTS ====================

// Get family account for a customer
router.get('/family-account/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const familyAccount = await familyAccountsRepo.findByCustomerId(customerId);
    
    if (familyAccount) {
      const members = await familyAccountsRepo.getMembers(familyAccount.id);
      res.json({ success: true, data: { account: familyAccount, members } });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error: any) {
    logger.error('Error fetching family account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create family account
router.post('/family-accounts', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { family_name, primary_customer_id, billing_type } = req.body;
    
    const account = await familyAccountsRepo.createAccount({
      family_name,
      primary_customer_id,
      billing_type: billing_type || 'individual',
      created_by: req.user?.id
    });
    
    res.json({ success: true, data: account });
  } catch (error: any) {
    logger.error('Error creating family account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add family member
router.post('/family-accounts/:accountId/members', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { accountId } = req.params;
    const { customer_id, relationship, is_billing_contact } = req.body;
    
    const member = await familyAccountsRepo.addMember({
      family_account_id: accountId,
      customer_id,
      relationship,
      is_billing_contact: is_billing_contact || false
    });
    
    res.json({ success: true, data: member });
  } catch (error: any) {
    logger.error('Error adding family member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ACTIVITY TIMELINE ====================

// Get activity timeline for a customer
router.get('/activity/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const { limit } = req.query;
    const activities = await activityTimelineRepo.findByCustomerId(
      customerId,
      limit ? parseInt(limit as string) : 50
    );
    res.json({ success: true, data: activities });
  } catch (error: any) {
    logger.error('Error fetching activity timeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SAVED FILTERS ====================

// Get saved filters for user
router.get('/saved-filters', async (req: AuthRequest, res) => {
  try {
    const filters = await savedFiltersRepo.findByUserId(req.user?.id || '');
    res.json({ success: true, data: filters });
  } catch (error: any) {
    logger.error('Error fetching saved filters:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create saved filter
router.post('/saved-filters', async (req: AuthRequest, res) => {
  try {
    const { filter_name, filter_type, filter_config, is_default } = req.body;
    
    const filter = await savedFiltersRepo.createFilter({
      user_id: req.user?.id || '',
      filter_name,
      filter_type,
      filter_config,
      is_default: is_default || false
    });
    
    res.json({ success: true, data: filter });
  } catch (error: any) {
    logger.error('Error creating saved filter:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update saved filter
router.put('/saved-filters/:filterId', async (req: AuthRequest, res) => {
  try {
    const { filterId } = req.params;
    const { filter_name, filter_config, is_default } = req.body;
    
    const filter = await savedFiltersRepo.updateFilter(filterId, {
      filter_name,
      filter_config,
      is_default
    });
    
    res.json({ success: true, data: filter });
  } catch (error: any) {
    logger.error('Error updating saved filter:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete saved filter
router.delete('/saved-filters/:filterId', async (req: AuthRequest, res) => {
  try {
    const { filterId } = req.params;
    await savedFiltersRepo.deleteFilter(filterId);
    res.json({ success: true, message: 'Filter deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting saved filter:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BULK OPERATIONS ====================

// Get bulk operations
router.get('/bulk-operations', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const operations = await bulkOperationsRepo.findByCreatedBy(req.user?.id || '');
    res.json({ success: true, data: operations });
  } catch (error: any) {
    logger.error('Error fetching bulk operations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create bulk operation
router.post('/bulk-operations', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { operation_type, operation_config, target_customer_ids } = req.body;
    
    const operation = await bulkOperationsRepo.createOperation({
      operation_type,
      operation_config,
      target_customer_ids,
      status: 'pending',
      total_count: target_customer_ids.length,
      created_by: req.user?.id
    });
    
    res.json({ success: true, data: operation });
  } catch (error: any) {
    logger.error('Error creating bulk operation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute bulk suspend
router.post('/bulk-suspend', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids, reason } = req.body;
    
    const operation = await bulkOperationsRepo.createOperation({
      operation_type: 'suspend',
      operation_config: { reason },
      target_customer_ids: customer_ids,
      status: 'in_progress',
      total_count: customer_ids.length,
      created_by: req.user?.id
    });
    
    await bulkOperationsRepo.startOperation(operation.id);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const customerId of customer_ids) {
      try {
        await supabase
          .from('customers')
          .update({ status: 'suspended', updated_at: Date.now() })
          .eq('id', customerId);
        
        // Log activity
        await activityTimelineRepo.logActivity(
          customerId,
          'status_changed',
          'Customer suspended (bulk operation)',
          reason,
          { bulk_operation_id: operation.id },
          req.user?.id
        );
        
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'success',
          error_message: null
        });
        
        await bulkOperationsRepo.incrementSuccess(operation.id);
        successCount++;
      } catch (error: any) {
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'failed',
          error_message: error.message
        });
        
        await bulkOperationsRepo.incrementFailure(operation.id, error.message);
        failureCount++;
      }
    }
    
    await bulkOperationsRepo.completeOperation(operation.id, successCount, failureCount);
    
    res.json({ success: true, data: { operation, successCount, failureCount } });
  } catch (error: any) {
    logger.error('Error executing bulk suspend:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute bulk activate
router.post('/bulk-activate', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids, reason } = req.body;
    
    const operation = await bulkOperationsRepo.createOperation({
      operation_type: 'activate',
      operation_config: { reason },
      target_customer_ids: customer_ids,
      status: 'in_progress',
      total_count: customer_ids.length,
      created_by: req.user?.id
    });
    
    await bulkOperationsRepo.startOperation(operation.id);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const customerId of customer_ids) {
      try {
        await supabase
          .from('customers')
          .update({ status: 'active', updated_at: Date.now() })
          .eq('id', customerId);
        
        // Log activity
        await activityTimelineRepo.logActivity(
          customerId,
          'status_changed',
          'Customer activated (bulk operation)',
          reason,
          { bulk_operation_id: operation.id },
          req.user?.id
        );
        
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'success',
          error_message: null
        });
        
        await bulkOperationsRepo.incrementSuccess(operation.id);
        successCount++;
      } catch (error: any) {
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'failed',
          error_message: error.message
        });
        
        await bulkOperationsRepo.incrementFailure(operation.id, error.message);
        failureCount++;
      }
    }
    
    await bulkOperationsRepo.completeOperation(operation.id, successCount, failureCount);
    
    res.json({ success: true, data: { operation, successCount, failureCount } });
  } catch (error: any) {
    logger.error('Error executing bulk activate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute bulk package change
router.post('/bulk-package-change', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids, new_package_id, reason } = req.body;
    
    const operation = await bulkOperationsRepo.createOperation({
      operation_type: 'package_change',
      operation_config: { new_package_id, reason },
      target_customer_ids: customer_ids,
      status: 'in_progress',
      total_count: customer_ids.length,
      created_by: req.user?.id
    });
    
    await bulkOperationsRepo.startOperation(operation.id);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const customerId of customer_ids) {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('package')
          .eq('id', customerId)
          .single();
        
        const oldPackageId = customer?.package || null;
        
        await supabase
          .from('customers')
          .update({ 
            package: new_package_id,
            updated_at: Date.now()
          })
          .eq('id', customerId);
        
        // Log package change history
        await packageHistoryRepo.logPackageChange(
          customerId,
          null,
          oldPackageId,
          new_package_id,
          reason,
          req.user?.id
        );
        
        // Log activity
        await activityTimelineRepo.logActivity(
          customerId,
          'package_changed',
          'Package changed (bulk operation)',
          reason,
          { old_package_id: oldPackageId, new_package_id, bulk_operation_id: operation.id },
          req.user?.id
        );
        
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'success',
          error_message: null
        });
        
        await bulkOperationsRepo.incrementSuccess(operation.id);
        successCount++;
      } catch (error: any) {
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'failed',
          error_message: error.message
        });
        
        await bulkOperationsRepo.incrementFailure(operation.id, error.message);
        failureCount++;
      }
    }
    
    await bulkOperationsRepo.completeOperation(operation.id, successCount, failureCount);
    
    res.json({ success: true, data: { operation, successCount, failureCount } });
  } catch (error: any) {
    logger.error('Error executing bulk package change:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute bulk billing
router.post('/bulk-billing', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids, billing_month, billing_year } = req.body;
    
    const operation = await bulkOperationsRepo.createOperation({
      operation_type: 'billing',
      operation_config: { billing_month, billing_year },
      target_customer_ids: customer_ids,
      status: 'in_progress',
      total_count: customer_ids.length,
      created_by: req.user?.id
    });
    
    await bulkOperationsRepo.startOperation(operation.id);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const customerId of customer_ids) {
      try {
        // Generate bill for customer
        const { data: customer } = await supabase
          .from('customers')
          .select('*, packages(*)')
          .eq('id', customerId)
          .single();
        
        if (!customer) {
          throw new Error('Customer not found');
        }
        
        const monthlyFee = customer.packages?.monthly_fee || 0;
        
        // Create invoice
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            customer_id: customerId,
            amount: monthlyFee,
            paid_amount: 0,
            remaining_balance: monthlyFee,
            status: 'unpaid',
            billing_month,
            billing_year,
            due_date: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
            created_at: Date.now()
          });
        
        if (invoiceError) throw invoiceError;
        
        // Log activity
        await activityTimelineRepo.logActivity(
          customerId,
          'invoice_generated',
          `Invoice generated for ${billing_month}/${billing_year}`,
          `Amount: ${monthlyFee}`,
          { billing_month, billing_year, amount: monthlyFee, bulk_operation_id: operation.id },
          req.user?.id
        );
        
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'success',
          error_message: null
        });
        
        await bulkOperationsRepo.incrementSuccess(operation.id);
        successCount++;
      } catch (error: any) {
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'failed',
          error_message: error.message
        });
        
        await bulkOperationsRepo.incrementFailure(operation.id, error.message);
        failureCount++;
      }
    }
    
    await bulkOperationsRepo.completeOperation(operation.id, successCount, failureCount);
    
    res.json({ success: true, data: { operation, successCount, failureCount } });
  } catch (error: any) {
    logger.error('Error executing bulk billing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute bulk SMS
router.post('/bulk-sms', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids, message } = req.body;
    
    const operation = await bulkOperationsRepo.createOperation({
      operation_type: 'sms',
      operation_config: { message },
      target_customer_ids: customer_ids,
      status: 'in_progress',
      total_count: customer_ids.length,
      created_by: req.user?.id
    });
    
    await bulkOperationsRepo.startOperation(operation.id);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const customerId of customer_ids) {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('mobile')
          .eq('id', customerId)
          .single();
        
        if (!customer || !customer.mobile) {
          throw new Error('Customer mobile not found');
        }
        
        // TODO: Integrate with SMS service (Twilio, etc.)
        // For now, just log the SMS
        logger.info(`SMS would be sent to ${customer.mobile}: ${message}`);
        
        // Log activity
        await activityTimelineRepo.logActivity(
          customerId,
          'sms_sent',
          'SMS sent (bulk operation)',
          message,
          { bulk_operation_id: operation.id },
          req.user?.id
        );
        
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'success',
          error_message: null
        });
        
        await bulkOperationsRepo.incrementSuccess(operation.id);
        successCount++;
      } catch (error: any) {
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'failed',
          error_message: error.message
        });
        
        await bulkOperationsRepo.incrementFailure(operation.id, error.message);
        failureCount++;
      }
    }
    
    await bulkOperationsRepo.completeOperation(operation.id, successCount, failureCount);
    
    res.json({ success: true, data: { operation, successCount, failureCount } });
  } catch (error: any) {
    logger.error('Error executing bulk SMS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute bulk WhatsApp
router.post('/bulk-whatsapp', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids, message } = req.body;
    
    const operation = await bulkOperationsRepo.createOperation({
      operation_type: 'whatsapp',
      operation_config: { message },
      target_customer_ids: customer_ids,
      status: 'in_progress',
      total_count: customer_ids.length,
      created_by: req.user?.id
    });
    
    await bulkOperationsRepo.startOperation(operation.id);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const customerId of customer_ids) {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('mobile')
          .eq('id', customerId)
          .single();
        
        if (!customer || !customer.mobile) {
          throw new Error('Customer mobile not found');
        }
        
        // TODO: Integrate with WhatsApp Business API
        // For now, just log the WhatsApp message
        logger.info(`WhatsApp message would be sent to ${customer.mobile}: ${message}`);
        
        // Log activity
        await activityTimelineRepo.logActivity(
          customerId,
          'whatsapp_sent',
          'WhatsApp message sent (bulk operation)',
          message,
          { bulk_operation_id: operation.id },
          req.user?.id
        );
        
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'success',
          error_message: null
        });
        
        await bulkOperationsRepo.incrementSuccess(operation.id);
        successCount++;
      } catch (error: any) {
        await bulkOperationsRepo.addResult({
          bulk_operation_id: operation.id,
          customer_id: customerId,
          status: 'failed',
          error_message: error.message
        });
        
        await bulkOperationsRepo.incrementFailure(operation.id, error.message);
        failureCount++;
      }
    }
    
    await bulkOperationsRepo.completeOperation(operation.id, successCount, failureCount);
    
    res.json({ success: true, data: { operation, successCount, failureCount } });
  } catch (error: any) {
    logger.error('Error executing bulk WhatsApp:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bulk operation results
router.get('/bulk-operations/:operationId/results', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { operationId } = req.params;
    const results = await bulkOperationsRepo.getResults(operationId);
    res.json({ success: true, data: results });
  } catch (error: any) {
    logger.error('Error fetching bulk operation results:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== EXPORT API ====================

// Export customers to CSV
router.post('/export/csv', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids, fields } = req.body;
    
    let query = supabase.from('customers').select('*');
    
    if (customer_ids && customer_ids.length > 0) {
      query = query.in('id', customer_ids);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Generate CSV
    const csvHeader = fields || ['name', 'mobile', 'email', 'area', 'status', 'package', 'fee'];
    const csvRows = data.map(customer => 
      csvHeader.map(field => customer[field] || '').join(',')
    );
    
    const csvContent = [csvHeader.join(','), ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers-export-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error: any) {
    logger.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export customers to Excel (JSON format for now)
router.post('/export/excel', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids, fields } = req.body;
    
    let query = supabase.from('customers').select('*, packages(*)');
    
    if (customer_ids && customer_ids.length > 0) {
      query = query.in('id', customer_ids);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Return JSON data that can be converted to Excel
    const exportData = data.map(customer => {
      const row: any = {};
      (fields || ['name', 'mobile', 'email', 'area', 'status', 'package', 'fee']).forEach(field => {
        row[field] = customer[field];
      });
      return row;
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=customers-export-${Date.now()}.json`);
    res.json({ success: true, data: exportData });
  } catch (error: any) {
    logger.error('Error exporting Excel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export customers to PDF (placeholder - requires PDF library)
router.post('/export/pdf', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { customer_ids } = req.body;
    
    // For now, return a message indicating PDF export requires additional setup
    res.json({ 
      success: false, 
      message: 'PDF export requires additional library setup (e.g., pdfkit, puppeteer). Please use CSV or Excel export for now.',
      data: null
    });
  } catch (error: any) {
    logger.error('Error exporting PDF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HISTORY ====================

// Get package history for customer
router.get('/package-history/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const { limit } = req.query;
    const history = await packageHistoryRepo.findByCustomerId(
      customerId,
      limit ? parseInt(limit as string) : 50
    );
    res.json({ success: true, data: history });
  } catch (error: any) {
    logger.error('Error fetching package history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get connection history for customer
router.get('/connection-history/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const { limit } = req.query;
    const history = await connectionHistoryRepo.findByCustomerId(
      customerId,
      limit ? parseInt(limit as string) : 50
    );
    res.json({ success: true, data: history });
  } catch (error: any) {
    logger.error('Error fetching connection history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADVANCED SEARCH ====================

// Advanced customer search
router.post('/search', async (req: AuthRequest, res) => {
  try {
    const {
      search_term,
      status,
      area,
      package_id,
      rating,
      priority,
      tags,
      labels,
      date_from,
      date_to,
      page = 1,
      limit = 20
    } = req.body;
    
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (search_term) {
      query = query.or(`name.ilike.%${search_term}%,mobile.ilike.%${search_term}%,email.ilike.%${search_term}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (area) {
      query = query.eq('area', area);
    }
    
    if (package_id) {
      query = query.eq('package_id', package_id);
    }
    
    if (rating !== undefined) {
      query = query.gte('rating', rating);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    
    if (date_to) {
      query = query.lte('created_at', date_to);
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Filter by tags and labels if provided (post-query filtering)
    let filteredData = data || [];
    
    if (tags && tags.length > 0) {
      const customerTags = await Promise.all(
        filteredData.map(async (customer) => {
          const customerTagList = await tagsRepo.findByCustomerId(customer.id);
          const tagNames = customerTagList.map(t => t.tag_name);
          return { customerId: customer.id, tagNames };
        })
      );
      
      filteredData = filteredData.filter(customer => {
        const customerTagNames = customerTags.find(ct => ct.customerId === customer.id)?.tagNames || [];
        return tags.some(tag => customerTagNames.includes(tag));
      });
    }
    
    if (labels && labels.length > 0) {
      const customerLabels = await Promise.all(
        filteredData.map(async (customer) => {
          const customerLabelList = await labelsRepo.findByCustomerId(customer.id);
          const labelNames = customerLabelList.map(l => l.label_name);
          return { customerId: customer.id, labelNames };
        })
      );
      
      filteredData = filteredData.filter(customer => {
        const customerLabelNames = customerLabels.find(cl => cl.customerId === customer.id)?.labelNames || [];
        return labels.some(label => customerLabelNames.includes(label));
      });
    }
    
    res.json({
      success: true,
      data: filteredData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    logger.error('Error in advanced search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
