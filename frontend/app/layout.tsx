import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'ReLoop AI — Identify. Recycle. Reward.',description:'AI-powered plastic waste guidance and recycling action tracker.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}