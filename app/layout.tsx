import "./globals.css";

export default function RootLayout({
    children,
} : {
    children: React.ReactNode;
}) {
    return (
        <html lang = 'en'>
            
            <body className="background">
                {children}
            </body>
        </html>
    );
}