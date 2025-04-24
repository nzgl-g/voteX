import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votex - Voting System",
  description: "A comprehensive voting system for various election types",
};

export default function MetadataLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
