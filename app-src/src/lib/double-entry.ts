/**
 * Double-Entry Transaction Engine
 * 
 * Sprint Q43: Creates double-entry transaction chain entries when
 * a contribution is approved (capital account credit).
 * 
 * Accounting model:
 * - Each contribution approval generates a debit/credit pair
 * - Debit: Patronage Expense (convergence-level)
 * - Credit: Member Capital Account (member-level)
 * - Transaction is recorded as a chain entry with full audit trail
 * 
 * REA mapping:
 * - Resource: Capital (patronage credit)
 * - Event: Contribution approval → transaction posting
 * - Agent: Member (credit recipient) + Convergence (debit holder)
 */

import { appendEntry } from './chain-engine'
import type { ChainEntry, TransactionPostedPayload } from '../types/chain'

// ─── Account Types ───────────────────────────────────────────────────

export type AccountType = 
  | 'capital'           // member capital account (equity)
  | 'patronage_expense' // convergence patronage expense (contra-equity)
  | 'retained'          // undistributed surplus
  | 'distribution'      // distributions payable

/**
 * Standard account ID format:
 * - Member capital: `capital:{memberId}`
 * - Patronage expense: `expense:patronage:{convergenceId}`
 * - Retained surplus: `retained:{convergenceId}`
 * - Distribution: `distribution:{memberId}`
 */
export function accountId(type: AccountType, entityId: string): string {
  switch (type) {
    case 'capital':
      return `capital:${entityId}`
    case 'patronage_expense':
      return `expense:patronage:${entityId}`
    case 'retained':
      return `retained:${entityId}`
    case 'distribution':
      return `distribution:${entityId}`
  }
}

// ─── Transaction Creation ────────────────────────────────────────────

/**
 * Post a double-entry transaction to the chain.
 * Every transaction has exactly one debit and one credit of equal amount.
 */
export async function postTransaction(params: {
  convergenceId: string
  transactionId: string
  debitAccountId: string
  creditAccountId: string
  amount: number
  description: string
  periodId?: string
  postedBy: string
  correlationId?: string  // link to originating event (e.g., contribution approval)
}): Promise<ChainEntry> {
  if (params.amount <= 0) {
    throw new Error('Transaction amount must be positive')
  }

  const payload: TransactionPostedPayload = {
    transactionId: params.transactionId,
    debitAccountId: params.debitAccountId,
    creditAccountId: params.creditAccountId,
    amount: params.amount,
    description: params.description,
    periodId: params.periodId,
    postedBy: params.postedBy,
    postedAt: new Date().toISOString(),
  }

  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'treasury.transaction.posted',
    aggregateId: params.transactionId,
    aggregateType: 'transaction',
    payload: payload as unknown as Record<string, unknown>,
    patternLayer: 5, // Flow
    actorId: params.postedBy,
    correlationId: params.correlationId,
  })
}

/**
 * Post the double-entry transaction for a contribution approval.
 * 
 * Debit: Patronage Expense (convergence bears the cost)
 * Credit: Member Capital Account (member receives equity credit)
 */
export async function postContributionCredit(params: {
  convergenceId: string
  transactionId: string
  memberId: string
  amount: number
  contributionId: string
  periodId?: string
  postedBy: string
}): Promise<ChainEntry> {
  return postTransaction({
    convergenceId: params.convergenceId,
    transactionId: params.transactionId,
    debitAccountId: accountId('patronage_expense', params.convergenceId),
    creditAccountId: accountId('capital', params.memberId),
    amount: params.amount,
    description: `Patronage credit for contribution ${params.contributionId}`,
    periodId: params.periodId,
    postedBy: params.postedBy,
    correlationId: params.contributionId,
  })
}

/**
 * Void a previously posted transaction (compensating entry).
 * Posts a reverse transaction (swap debit/credit) linked to the original.
 */
export async function voidTransaction(params: {
  convergenceId: string
  originalTransactionId: string
  compensatingTransactionId: string
  originalDebitAccountId: string
  originalCreditAccountId: string
  amount: number
  reason: string
  voidedBy: string
}): Promise<ChainEntry> {
  // Reverse: credit what was debited, debit what was credited
  return postTransaction({
    convergenceId: params.convergenceId,
    transactionId: params.compensatingTransactionId,
    debitAccountId: params.originalCreditAccountId,  // reversed
    creditAccountId: params.originalDebitAccountId,   // reversed
    amount: params.amount,
    description: `VOID: ${params.reason} (reverses ${params.originalTransactionId})`,
    postedBy: params.voidedBy,
    correlationId: params.originalTransactionId,
  })
}

/**
 * Create an account entry in the chain (for tracking account existence).
 */
export async function createAccount(params: {
  convergenceId: string
  accountId: string
  accountType: AccountType
  ownerId: string  // member ID or convergence ID
  name: string
  actorId: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'treasury.account.created',
    aggregateId: params.accountId,
    aggregateType: 'account',
    payload: {
      accountId: params.accountId,
      accountType: params.accountType,
      ownerId: params.ownerId,
      name: params.name,
      createdAt: new Date().toISOString(),
    },
    patternLayer: 1, // Identity
    actorId: params.actorId,
  })
}
