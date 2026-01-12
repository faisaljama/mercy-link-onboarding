export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout removes the sidebar for the print page
  return <>{children}</>;
}
