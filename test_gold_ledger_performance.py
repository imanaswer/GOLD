#!/usr/bin/env python3
"""
Test script for Gold Ledger Performance - Module 1/10
Tests the system's ability to handle a large number of parties and ledger entries.
"""

import requests
import json
from datetime import datetime
import random
import time

BASE_URL = "http://localhost:8001/api"
NUM_PARTIES = 50
ENTRIES_PER_PARTY = 20

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    print(f"{BLUE}ℹ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}⚠ {message}{RESET}")

# Test results tracking
total_tests = 0
passed_tests = 0

def run_test(test_name, test_func):
    global total_tests, passed_tests
    total_tests += 1
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST {total_tests}: {test_name}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    try:
        result = test_func()
        if result:
            passed_tests += 1
            print_success(f"TEST PASSED: {test_name}")
        else:
            print_error(f"TEST FAILED: {test_name}")
        return result
    except Exception as e:
        print_error(f"TEST EXCEPTION: {test_name}")
        print_error(f"Error: {str(e)}")
        return False

def login():
    """Login and get auth token"""
    print_info("Logging in as admin...")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })

    if response.status_code == 200:
        token = response.json()['access_token']
        print_success(f"Login successful.")
        return token
    else:
        print_error(f"Login failed: {response.status_code} - {response.text}")
        return None

def create_party(token, i):
    """Creates a single party."""
    party_data = {
        "name": f"Perf Test Party {i} {datetime.now().strftime('%Y%m%d%H%M%S')}",
        "phone": f"9{str(i).zfill(9)}",
        "address": f"{i} Performance Test Lane",
        "party_type": "customer",
    }
    response = requests.post(
        f"{BASE_URL}/parties",
        headers={"Authorization": f"Bearer {token}"},
        json=party_data
    )
    if response.status_code == 200:
        return response.json()['id']
    else:
        print_error(f"Party creation failed for party {i}: {response.status_code} - {response.text}")
        return None

def create_ledger_entry(token, party_id, entry_type, weight):
    """Creates a single gold ledger entry."""
    entry_data = {
        "party_id": party_id,
        "type": entry_type,
        "weight_grams": weight,
        "purity_entered": 22,
        "purpose": "advance_gold" if entry_type == "IN" else "job_work",
        "reference_type": "manual",
    }
    response = requests.post(
        f"{BASE_URL}/gold-ledger",
        headers={"Authorization": f"Bearer {token}"},
        json=entry_data
    )
    return response.status_code == 200

def get_party_gold_summary(token, party_id):
    """Gets the gold summary for a party."""
    response = requests.get(
        f"{BASE_URL}/parties/{party_id}/gold-summary",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 200:
        return response.json()
    return None


def test_bulk_operations():
    """
    Test creating a large number of parties and ledger entries.
    Then, verify the gold summary for each party.
    """
    token = login()
    if not token:
        return False

    parties_data = [] # List to store {id, expected_balance}

    # --- 1. Create Parties ---
    print_info(f"Creating {NUM_PARTIES} parties...")
    start_time = time.time()
    for i in range(NUM_PARTIES):
        party_id = create_party(token, i + 1)
        if party_id:
            parties_data.append({"id": party_id, "expected_balance": 0.0})
            print(f"  Created party {i+1}/{NUM_PARTIES}", end='\r')
        else:
            print_error(f"Stopping test due to party creation failure.")
            return False
    duration = time.time() - start_time
    print_success(f"\nCreated {NUM_PARTIES} parties in {duration:.2f} seconds.")

    # --- 2. Create Ledger Entries ---
    print_info(f"Creating {ENTRIES_PER_PARTY} ledger entries for each of the {NUM_PARTIES} parties...")
    total_entries = NUM_PARTIES * ENTRIES_PER_PARTY
    start_time = time.time()
    entries_created = 0

    for i, party in enumerate(parties_data):
        net_balance = 0.0
        for j in range(ENTRIES_PER_PARTY):
            weight = round(random.uniform(10.0, 200.0), 3)
            if j % 2 == 0: # Even j for IN
                entry_type = "IN"
                net_balance += weight
            else: # Odd j for OUT
                entry_type = "OUT"
                net_balance -= weight

            if not create_ledger_entry(token, party['id'], entry_type, weight):
                print_error(f"Failed to create ledger entry for party {party['id']}. Stopping.")
                return False

            entries_created += 1
            print(f"  Entries created: {entries_created}/{total_entries}", end='\r')

        parties_data[i]['expected_balance'] = round(net_balance, 3)

    duration = time.time() - start_time
    print_success(f"\nCreated {total_entries} ledger entries in {duration:.2f} seconds.")

    # --- 3. Verify Gold Summaries ---
    print_info(f"Verifying gold summary for all {NUM_PARTIES} parties...")
    all_summaries_correct = True
    start_time = time.time()

    for i, party in enumerate(parties_data):
        summary = get_party_gold_summary(token, party['id'])
        if not summary:
            print_error(f"Could not get summary for party {party['id']}")
            all_summaries_correct = False
            continue

        actual_balance = summary.get('net_gold_balance')
        expected_balance = party['expected_balance']

        if actual_balance != expected_balance:
            print_error(f"Balance mismatch for party {party['id']}: Expected {expected_balance}, Got {actual_balance}")
            all_summaries_correct = False

        print(f"  Verified party {i+1}/{NUM_PARTIES}", end='\r')

    duration = time.time() - start_time
    print_success(f"\nVerified {NUM_PARTIES} summaries in {duration:.2f} seconds.")

    return all_summaries_correct

def main():
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}GOLD LEDGER PERFORMANCE TEST SUITE{RESET}")
    print(f"{BLUE}Testing with {NUM_PARTIES} parties and {ENTRIES_PER_PARTY} entries each.{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")

    start_total_time = time.time()

    run_test("Bulk Data Creation and Verification", test_bulk_operations)

    duration_total = time.time() - start_total_time
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"Total Tests: {total_tests}")
    print(f"{GREEN}Passed: {passed_tests}{RESET}")
    print(f"{RED}Failed: {total_tests - passed_tests}{RESET}")

    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    print(f"Total execution time: {duration_total:.2f} seconds.")

    if passed_tests == total_tests:
        print(f"\n{GREEN}{'='*80}{RESET}")
        print(f"{GREEN}🎉 ALL PERFORMANCE TESTS PASSED! 🎉{RESET}")
        print(f"{GREEN}{'='*80}{RESET}\n")
    else:
        print(f"\n{YELLOW}{'='*80}{RESET}")
        print(f"{YELLOW}⚠ PERFORMANCE TESTS FAILED. PLEASE REVIEW THE OUTPUT. ⚠{RESET}")
        print(f"{YELLOW}{'='*80}{RESET}\n")

if __name__ == "__main__":
    main()
