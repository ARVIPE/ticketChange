"use client"

import { UserProvider } from "./core/auth/userContext"

export default function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  )
}
