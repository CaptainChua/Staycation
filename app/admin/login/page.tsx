import Login from "@/Components/admin/Owners/Modals/AdminLogin"
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven | Admin Login",
  description: "Login to the admin panel of Owner's Hub to manage properties, users, and site settings.",
}

const AdminLogin = () => {
  return (
    <Login />
  )
}

export default AdminLogin