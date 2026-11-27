/**
 * Exact judge-ready sample noisy text demonstrating:
 * - Repeated emails (john.doe@gmail.com)
 * - Indian phone numbers (+91 9876543210 and 9123456789)
 * - Valid IPv4 (192.168.1.100) and invalid IPv4 (999.999.999.999)
 * - Valid PAN (ABCDE1234F)
 * - Aadhaar-style number (2345 6789 0123)
 * - Luhn-valid credit card (4532015112830366)
 * - Random 16-digit number failing Luhn (1234567890123456)
 */
export const SAMPLE_NOISY_TEXT = `Name: John Doe
Email: john.doe@gmail.com
Backup Email: john.doe@gmail.com
Phone: +91 9876543210
Alternate Phone: 9123456789
IP Address: 192.168.1.100
Invalid IP: 999.999.999.999
PAN: ABCDE1234F
Aadhaar: 2345 6789 0123
Credit Card: 4532015112830366
Random Number: 1234567890123456`;

export const SAMPLE_CSV_TEXT = `customer_id,full_name,email,phone,ip_address,pan,aadhaar,card_number
101,"Doe, John",john.doe@gmail.com,+91 9876543210,192.168.1.100,ABCDE1234F,2345 6789 0123,4532015112830366
102,"Doe, John (Backup)",john.doe@gmail.com,9123456789,10.0.4.25,ABCDE1234F,1234 5678 9012,1234567890123456
103,"Smith, Alice",alice.smith@company.org,+1 202-555-0145,999.999.999.999,PQRST5678K,3456-7890-1234,4532-0151-1283-0366`;
