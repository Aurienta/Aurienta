#!/usr/bin/env python3
"""Change money-related Float fields to Decimal in prisma/schema.prisma."""
import re
from pathlib import Path

SCHEMA = Path("/home/z/my-project/prisma/schema.prisma")
content = SCHEMA.read_text()

# Money field patterns: fields with Egp suffix, or money-related names
MONEY_FIELD_NAMES = [
    "amountEgp", "avgPriceEgp", "cgtEgp", "costPerUnitEgp", "cppEgp",
    "currentBalanceEgp", "equityUnitPriceEgp", "equityUnitPriceUsd",
    "feesEgp", "fxRateUsdToEgp", "grossEgp", "hourlyRateEgp",
    "internalBalanceEgp", "lawFirmBalanceEgp", "matchedPriceEgp",
    "perShareDividendEgp", "platformFeeEgp", "priceEgp",
    "repaidEgp", "sellPriceEgp", "totalContributedEgp", "totalCostEgp",
    "totalEgp", "totalLoanedEgp", "totalPriceEgp", "totalRepaidEgp",
    "triggeredByPrice", "referencePrice", "unitPriceEgp", "varianceEgp",
    "fxLockedRate", "fxRateLocked",
]

# Build regex: match field name + whitespace + Float
# Pattern: (fieldName)(\s+)Float\b
count = 0
for name in MONEY_FIELD_NAMES:
    # Match the field name followed by whitespace and Float (word boundary)
    pattern = re.compile(r"\b(" + re.escape(name) + r")(\s+)Float\b")
    new_content, n = pattern.subn(r"\1\2Decimal @db.Decimal(18, 2)", content)
    count += n
    content = new_content

original_floats = len(re.findall(r"\bFloat\b", SCHEMA.read_text()))
new_floats = len(re.findall(r"\bFloat\b", content))
new_decimals = len(re.findall(r"Decimal @db\.Decimal\(18, 2\)", content))

print(f"Changed {count} Float → Decimal")
print(f"Original Float: {original_floats}, Remaining Float: {new_floats}, New Decimal: {new_decimals}")

SCHEMA.write_text(content)
print(f"Schema updated: {SCHEMA}")
