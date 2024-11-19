import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
 
export default function RootLayout({
    children
}:{
    children: React.ReactNode;
}){
    return(
        <>
        <Header />
        <div className="background">
        {children}
        </div>
        <Footer />
        </>
    )
}