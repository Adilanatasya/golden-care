import { Resident, Visitor } from '../types';
import { apiRequest } from './api';

export interface VisitorInput {
  resident_id: number;
  visitor_name: string;
  relationship: string;
  contact_phone: string;
  check_in: string;
  status?: Visitor['status'];
}

interface ApiEnvelope<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

interface PaginatedVisitors {
  current_page: number;
  data: RawVisitor[];
  last_page: number;
}

interface RawVisitor {
  id: number | string;
  resident_id: number | string;
  visitor_name: string;
  relationship: string;
  contact_phone?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  status?: Visitor['status'] | null;
  visit_date: string;
  created_at: string;
  resident?: Resident;
}

/* =========================================================
   NORMALIZE VISITOR
========================================================= */

const normalizeVisitor = (
  visitor: RawVisitor
): Visitor => ({
  id: Number(visitor.id),

  resident_id: Number(
    visitor.resident_id
  ),

  visitor_name:
    visitor.visitor_name,

  relationship:
    visitor.relationship,

  contact_phone:
    visitor.contact_phone || '',

  check_in:
    visitor.check_in ||
    visitor.visit_date,

  check_out:
    visitor.check_out ||
    undefined,

  status:
    visitor.status ||
    'Checked In',

  visit_date:
    visitor.visit_date,

  created_at:
    visitor.created_at,

  resident:
    visitor.resident,
});

/* =========================================================
   GET VISITORS
========================================================= */

export async function getVisitors(): Promise<
  Visitor[]
> {
  const visitors: Visitor[] = [];

  let currentPage = 1;
  let lastPage = 1;

  do {
    const response =
      await apiRequest<
        ApiEnvelope<PaginatedVisitors>
      >(
        `/visitors?page=${currentPage}`
      );

    visitors.push(
      ...response.data.data.map(
        normalizeVisitor
      )
    );

    lastPage =
      response.data.last_page;

    currentPage += 1;
  } while (
    currentPage <= lastPage
  );

  return visitors;
}

/* =========================================================
   CREATE VISITOR
========================================================= */

export async function createVisitor(
  input: VisitorInput
): Promise<Visitor> {
  const response =
    await apiRequest<
      ApiEnvelope<RawVisitor>
    >('/visitors', {
      method: 'POST',

      body: JSON.stringify({
        ...input,

        status:
          input.status ||
          'Checked In',
      }),
    });

  return normalizeVisitor(
    response.data
  );
}

/* =========================================================
   CHECK IN
========================================================= */

export async function checkInVisitor(
  id: number
): Promise<Visitor> {
  const response =
    await apiRequest<
      ApiEnvelope<RawVisitor>
    >(
      `/visitors/${id}/check-in`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          /*
           * Send UTC ISO 8601 timestamp.
           *
           * Example:
           * 2026-10-03T16:30:00.000Z
           *
           * Laravel runs in UTC and the
           * browser will convert it back
           * to Malaysia local time when
           * displayed.
           */
          occurred_at:
            new Date().toISOString(),
        }),
      }
    );

  return normalizeVisitor(
    response.data
  );
}

/* =========================================================
   CHECK OUT
========================================================= */

export async function checkOutVisitor(
  id: number
): Promise<Visitor> {
  const response =
    await apiRequest<
      ApiEnvelope<RawVisitor>
    >(
      `/visitors/${id}/check-out`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          occurred_at:
            new Date().toISOString(),
        }),
      }
    );

  return normalizeVisitor(
    response.data
  );
}