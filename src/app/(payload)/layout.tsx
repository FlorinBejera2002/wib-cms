import React from 'react'
import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'

type Args = {
  children: React.ReactNode
}

const serverFunction = async function (...args: Parameters<typeof handleServerFunctions>) {
  'use server'
  return handleServerFunctions(...args)
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
