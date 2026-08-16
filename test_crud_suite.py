#!/usr/bin/env python3
"""
Comprehensive CRUD test suite for TrigonLinks ERP.
Tests all CRUD operations with 3 users: admin, staff, customer.
"""
import requests
import json
import time
import sys

BASE_URL = "https://lightgreen-rhinoceros-358548.hostingersite.com"

# Test users
USERS = {
    "admin": {"email": "mohsinbhalli147@gmail.com", "password": "Zimal@123"},
    "staff": {"email": "staff@trigonlinks.com", "password": "staff123"},
}

# Customer login uses username + cnic
CUSTOMER = {"username": "FAISAL 3", "cnic": ""}

results = {"pass": 0, "fail": 0, "errors": []}
tokens = {}


def log_test(name, success, detail=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"  {status}: {name}" + (f" — {detail}" if detail else ""))
    if success:
        results["pass"] += 1
    else:
        results["fail"] += 1
        results["errors"].append(f"{name}: {detail}")


def login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=15)
    data = r.json()
    if data.get("accessToken"):
        return data["accessToken"]
    return None


def api_call(method, path, token=None, data=None, params=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.request(method, f"{BASE_URL}{path}", headers=headers, json=data, params=params, timeout=30)
        return r.status_code, r.json() if r.text else {}
    except Exception as e:
        return 0, {"error": str(e)}


def test_auth():
    print("\n=== 1. AUTHENTICATION ===")
    for role, creds in USERS.items():
        token = login(creds["email"], creds["password"])
        tokens[role] = token
        log_test(f"Login as {role}", token is not None, f"token={'yes' if token else 'no'}")

    # Test customer login — use FAISAL 3 (known customer with username/cnic)
    r = requests.post(f"{BASE_URL}/api/auth/customer-login",
                      json={"username": "faisal3808", "cnic": "3460212345678"}, timeout=15)
    cd = r.json()
    tokens["customer"] = cd.get("accessToken")
    log_test("Customer login (FAISAL 3)", cd.get("accessToken") is not None,
             f"user=faisal3808 token={'yes' if cd.get('accessToken') else 'no'}")


def test_customer_crud():
    print("\n=== 2. CUSTOMER CRUD ===")
    token = tokens["admin"]

    # CREATE
    test_customer = {
        "name": "Test Customer CRUD",
        "mobile": "03001234599",
        "cnic": "3520212345678",
        "address": "Test Address, CRUD Street",
        "area": "Test Area",
        "package": "Basic",
        "fee": 1500,
        "status": "active",
        "username": "testcrud123",
        "fatherName": "Test Father",
    }
    sc, data = api_call("POST", "/api/customers", token, data=test_customer)
    cust_id = None
    if sc in (200, 201) and (data.get("success") or data.get("id") or data.get("data")):
        cust_data = data.get("data", data)
        cust_id = cust_data.get("id") if isinstance(cust_data, dict) else None
        if not cust_id and isinstance(data, dict):
            cust_id = data.get("id")
        log_test("Create customer", True, f"id={cust_id}")
    else:
        log_test("Create customer", False, f"sc={sc} msg={str(data)[:200]}")

    # READ (list with pagination)
    sc, data = api_call("GET", "/api/customers", token, params={"page": 1, "limit": 10})
    log_test("List customers (paginated)", sc == 200, f"sc={sc}")

    # READ (single)
    if cust_id:
        sc, data = api_call("GET", f"/api/customers/{cust_id}", token)
        log_test("Get customer by ID", sc == 200, f"sc={sc}")

        # UPDATE
        sc, data = api_call("PUT", f"/api/customers/{cust_id}", token, data={"fee": 2000, "address": "Updated Address"})
        log_test("Update customer", sc in (200, 204), f"sc={sc}")

        # READ again to verify update
        sc, data = api_call("GET", f"/api/customers/{cust_id}", token)
        updated = data.get("data", data)
        new_fee = updated.get("fee") if isinstance(updated, dict) else None
        log_test("Verify update", new_fee == 2000, f"fee={new_fee}")

        # DELETE
        sc, data = api_call("DELETE", f"/api/customers/{cust_id}", token)
        log_test("Delete customer", sc in (200, 204), f"sc={sc}")
    else:
        log_test("Get/Update/Delete customer", False, "no customer ID from create")

    # Pagination verification
    sc, data = api_call("GET", "/api/customers", token, params={"page": 1, "limit": 5})
    if sc == 200:
        pag = data.get("pagination", {}) if isinstance(data, dict) else {}
        log_test("Pagination metadata", "total" in pag and "totalPages" in pag,
                 f"total={pag.get('total')}, pages={pag.get('totalPages')}")
    else:
        log_test("Pagination metadata", False, f"sc={sc}")

    # Search
    sc, data = api_call("GET", "/api/customers", token, params={"search": "test"})
    log_test("Customer search", sc == 200, f"sc={sc}")


def test_invoice_crud():
    print("\n=== 3. INVOICE CRUD ===")
    token = tokens["admin"]

    # LIST
    sc, data = api_call("GET", "/api/invoices", token, params={"page": 1, "limit": 10})
    log_test("List invoices", sc == 200, f"sc={sc}")

    # Get a customer for invoice generation
    sc, data = api_call("GET", "/api/customers", token, params={"limit": 1, "status": "active"})
    cust_data = data.get("data", data) if sc == 200 else {}
    customers_list = cust_data if isinstance(cust_data, list) else cust_data.get("data", [])
    cust_id = customers_list[0]["id"] if customers_list else None

    # GENERATE invoice for customer
    if cust_id:
        sc, data = api_call("POST", f"/api/billing/generate/{cust_id}", token, data={})
        log_test("Generate customer bill", sc == 200, f"sc={sc}")

        # GET invoice list to find created invoice
        sc, data = api_call("GET", "/api/invoices", token, params={"page": 1, "limit": 5})
        inv_data = data.get("data", data) if isinstance(data, dict) else []
        inv_list = inv_data if isinstance(inv_data, list) else inv_data.get("data", [])
        inv_id = inv_list[0]["id"] if inv_list else None

        if inv_id:
            # READ single
            sc, data = api_call("GET", f"/api/invoices/{inv_id}", token)
            log_test("Get invoice by ID", sc == 200, f"sc={sc}")

    # Test background generation endpoint
    # NOTE: New endpoints (generate-monthly background, areas, auto-generate, job status)
    # require production deployment to test with real DB. Local backend has placeholder Supabase.
    sc, data = api_call("POST", "/api/billing/generate-monthly", token, data={"forceAll": False})
    has_job = data.get("jobId") if isinstance(data, dict) else None
    if has_job:
        log_test("Background bill generation", True, f"jobId={has_job}")
        time.sleep(2)
        sc2, data2 = api_call("GET", f"/api/billing/job/{has_job}", token)
        job_status = data2.get("job", {}).get("status") if isinstance(data2, dict) else None
        log_test("Job status check", sc2 == 200, f"status={job_status}")
    elif sc == 404:
        log_test("Background bill generation", False, "endpoint not deployed to production yet")
    else:
        log_test("Background bill generation", False, f"sc={sc} msg={str(data)[:150]}")

    # Areas endpoint
    sc, data = api_call("GET", "/api/billing/areas", token)
    log_test("Get areas", sc == 200, f"sc={sc}" + (" (not deployed yet)" if sc == 404 else ""))

    # Auto-generate trigger
    sc, data = api_call("POST", "/api/billing/auto-generate/trigger", token)
    log_test("Auto-generate trigger", sc == 200, f"sc={sc}" + (" (not deployed yet)" if sc == 404 else ""))


def test_payment_crud():
    print("\n=== 4. PAYMENT CRUD ===")
    token = tokens["admin"]

    # Get invoices
    sc, data = api_call("GET", "/api/invoices", token, params={"page": 1, "limit": 10})
    inv_data = data.get("data", data) if isinstance(data, dict) else []
    inv_list = inv_data if isinstance(inv_data, list) else inv_data.get("data", [])

    # Find an unpaid invoice
    unpaid = next((i for i in inv_list if i.get("status") in ("unpaid", "partial")), None)
    if unpaid:
        inv_id = unpaid["id"]
        # Process payment
        sc, data = api_call("POST", f"/api/billing/payment/{inv_id}", token,
                            data={"amount": 500, "paymentMethod": "cash"})
        log_test("Process payment", sc == 200, f"sc={sc}")

        # Get payment history
        cust_id = unpaid.get("customer_id")
        if cust_id:
            sc, data = api_call("GET", f"/api/billing/payments/{cust_id}", token)
            log_test("Get payment history", sc == 200, f"sc={sc}")

        # Billing summary
        sc, data = api_call("GET", f"/api/billing/summary/{cust_id}", token)
        log_test("Get billing summary", sc == 200, f"sc={sc}")
    else:
        log_test("Payment tests", False, "no unpaid invoice found")


def test_staff_crud():
    print("\n=== 5. STAFF CRUD ===")
    token = tokens["admin"]

    sc, data = api_call("GET", "/api/staff", token)
    log_test("List staff", sc == 200, f"sc={sc}")

    # CREATE staff
    # NOTE: staff table needs migration 015 (address/cnic/position columns) to be deployed.
    # On production without migration, address field causes 500. Test will pass after deploy.
    test_staff = {
        "name": "Test Staff CRUD",
        "username": f"teststaff{int(time.time())}",
        "email": f"teststaff{int(time.time())}@test.com",
        "password": "testpass123",
        "phone": "03001234588",
        "role": "staff",
        "position": "Technician",
        "salary": 25000,
        "address": "Test Address",
        "cnic": "3520298765432",
    }
    sc, data = api_call("POST", "/api/staff", token, data=test_staff)
    staff_id = None
    if sc in (200, 201):
        s_data = data.get("data", data) if isinstance(data, dict) else {}
        staff_id = s_data.get("id") if isinstance(s_data, dict) else None
        if not staff_id and isinstance(data, dict):
            staff_id = data.get("id")
        log_test("Create staff", True, f"id={staff_id}")
    elif sc == 500 and "address" in str(data):
        log_test("Create staff", False, "needs migration 015 deployed (address/cnic/position columns)")
    else:
        log_test("Create staff", False, f"sc={sc} msg={str(data)[:200]}")

    if staff_id:
        # READ
        sc, data = api_call("GET", f"/api/staff/{staff_id}", token)
        log_test("Get staff by ID", sc == 200, f"sc={sc}")

        # UPDATE
        sc, data = api_call("PUT", f"/api/staff/{staff_id}", token, data={"salary": 30000})
        log_test("Update staff", sc in (200, 204), f"sc={sc}")

        # DELETE
        sc, data = api_call("DELETE", f"/api/staff/{staff_id}", token)
        log_test("Delete staff", sc in (200, 204), f"sc={sc}")


def test_inventory_crud():
    print("\n=== 6. INVENTORY CRUD ===")
    token = tokens["admin"]

    sc, data = api_call("GET", "/api/inventory", token)
    log_test("List inventory", sc == 200, f"sc={sc}")

    # CREATE
    test_item = {
        "name": f"Test Item {int(time.time())}",
        "category": "Router",
        "qty": 10,
        "price": 1500,
    }
    sc, data = api_call("POST", "/api/inventory", token, data=test_item)
    item_id = None
    if sc in (200, 201):
        i_data = data.get("data", data) if isinstance(data, dict) else {}
        item_id = i_data.get("id") if isinstance(i_data, dict) else None
        if not item_id and isinstance(data, dict):
            item_id = data.get("id")
        log_test("Create inventory item", True, f"id={item_id}")
    else:
        log_test("Create inventory item", False, f"sc={sc} msg={str(data)[:200]}")

    if item_id:
        # READ
        sc, data = api_call("GET", f"/api/inventory/{item_id}", token)
        log_test("Get inventory by ID", sc == 200, f"sc={sc}")

        # UPDATE
        sc, data = api_call("PUT", f"/api/inventory/{item_id}", token, data={"quantity": 20})
        log_test("Update inventory", sc in (200, 204), f"sc={sc}")

        # DELETE
        sc, data = api_call("DELETE", f"/api/inventory/{item_id}", token)
        log_test("Delete inventory", sc in (200, 204), f"sc={sc}")


def test_role_based_access():
    print("\n=== 7. ROLE-BASED ACCESS CONTROL ===")
    staff_token = tokens.get("staff")

    if staff_token:
        # Staff should NOT be able to generate monthly bills
        sc, data = api_call("POST", "/api/billing/generate-monthly", staff_token, data={"forceAll": True})
        log_test("Staff blocked from bill generation", sc == 403, f"sc={sc}")

        # Staff SHOULD be able to view customers
        sc, data = api_call("GET", "/api/customers", staff_token, params={"limit": 5})
        log_test("Staff can view customers", sc == 200, f"sc={sc}")

        # Staff should NOT delete customers
        sc, data = api_call("DELETE", "/api/customers/fake-id", staff_token)
        log_test("Staff blocked from delete customer", sc == 403, f"sc={sc}")
    else:
        log_test("Staff access tests", False, "no staff token")


def test_dashboard():
    print("\n=== 8. DASHBOARD & REPORTS ===")
    token = tokens["admin"]

    sc, data = api_call("GET", "/api/dashboard/statistics", token, params={"stage": "summary"})
    log_test("Dashboard statistics", sc == 200, f"sc={sc}")


def main():
    print("=" * 60)
    print("  TrigonLinks ERP — Comprehensive CRUD Test Suite")
    print("=" * 60)

    test_auth()

    if not tokens.get("admin"):
        print("\n❌ Admin login failed — cannot continue tests")
        sys.exit(1)

    test_customer_crud()
    test_invoice_crud()
    test_payment_crud()
    test_staff_crud()
    test_inventory_crud()
    test_role_based_access()
    test_dashboard()

    print("\n" + "=" * 60)
    print(f"  RESULTS: {results['pass']} passed, {results['fail']} failed")
    print("=" * 60)

    if results["errors"]:
        print("\nFailed tests:")
        for e in results["errors"]:
            print(f"  - {e}")

    sys.exit(0 if results["fail"] == 0 else 1)


if __name__ == "__main__":
    main()
