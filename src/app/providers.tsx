"use client"

import type React from "react"
import { UserProvider } from "./core/auth/userContext"
import { TicketProvider } from "./core/tickets/ticketContext"
import { EventProvider } from "./business/events/eventContext"
import { TransactionProvider } from "./business/transactions/transactionContext"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <EventProvider>
        <TicketProvider>
          <TransactionProvider>{children}</TransactionProvider>
        </TicketProvider>
      </EventProvider>
    </UserProvider>
  )
}
