import "./globals.css";

export const metadata = {
  title: "Ahsania S&S Management",
  description: "Inventory and Sales Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Roboto:wght@400;500;700&display=swap" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
