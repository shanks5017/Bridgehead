import os
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Query

app = FastAPI(title="Zonek Companies API", description="Phase 1 MVP API Layer")

def get_db_connection():
    # Use the same fallback default as pipeline
    return psycopg2.connect(os.environ.get("DATABASE_URL", "postgresql://zonek:zonek_dev_password@localhost:5432/zonek_test"))

def _format_company_response(company_row, provenance_rows):
    """
    Format a single company record, wrapping each business field in {value, provenance}.
    """
    prov_dict = {}
    for prov in provenance_rows:
        prov_dict[prov["field_name"]] = {
            "source": prov["source"],
            "confidence_score": float(prov["confidence_score"]),
            "last_verified_at": prov["last_verified_at"].isoformat() if prov["last_verified_at"] else None
        }

    # The exact fields from the DB schema that need provenance wrapping
    business_fields = [
        "company_name", "company_status", "company_class", "company_category",
        "incorporation_date", "roc", "state", "registered_address",
        "authorised_capital", "paid_up_capital", "nic_code"
    ]

    response = {
        "cin": company_row["cin"],
        "created_at": company_row["created_at"].isoformat() if company_row["created_at"] else None,
        "updated_at": company_row["updated_at"].isoformat() if company_row["updated_at"] else None,
    }

    for field in business_fields:
        val = company_row.get(field)
        if val is None:
            response[field] = None
        else:
            # Handle JSON serialization for special types
            if isinstance(val, (date, datetime)):
                val = val.isoformat()
            elif isinstance(val, Decimal):
                val = float(val)

            response[field] = {
                "value": val,
                "provenance": prov_dict.get(field)
            }

    return response

@app.get("/companies/{cin}")
def get_company(cin: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Fetch company
            cur.execute("SELECT * FROM companies WHERE cin = %s;", (cin,))
            company = cur.fetchone()
            
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")

            # Fetch provenance
            cur.execute("SELECT * FROM field_provenance WHERE cin = %s;", (cin,))
            provenance = cur.fetchall()

    return _format_company_response(company, provenance)

@app.get("/companies")
def list_companies(
    state: Optional[str] = Query(None, description="Filter by state name (case-insensitive)"),
    status: Optional[str] = Query(None, description="Filter by company status (case-insensitive)"),
    nic_code: Optional[str] = Query(None, description="Filter by NIC code"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = "SELECT * FROM companies WHERE 1=1"
            params = []
            
            if state:
                query += " AND lower(state) = %s"
                params.append(state.lower())
            if status:
                query += " AND lower(company_status) = %s"
                params.append(status.lower())
            if nic_code:
                query += " AND nic_code = %s"
                params.append(nic_code)
                
            query += " ORDER BY created_at DESC LIMIT %s OFFSET %s;"
            params.extend([limit, offset])
            
            cur.execute(query, tuple(params))
            companies = cur.fetchall()
            
            if not companies:
                return {"items": [], "total": 0, "limit": limit, "offset": offset}
            
            cins = [c["cin"] for c in companies]
            
            # Fetch provenance for all fetched CINs
            cur.execute("SELECT * FROM field_provenance WHERE cin = ANY(%s);", (cins,))
            provenance = cur.fetchall()
            
            # Group provenance by cin
            prov_by_cin = {}
            for p in provenance:
                prov_by_cin.setdefault(p["cin"], []).append(p)
                
            items = []
            for comp in companies:
                items.append(_format_company_response(comp, prov_by_cin.get(comp["cin"], [])))
                
            return {
                "items": items,
                "limit": limit,
                "offset": offset
            }
