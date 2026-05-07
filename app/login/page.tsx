import Login from "@/Components/Login";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven PH | Login",
  description: "Login to your Staycation Haven PH account to continue.",
};  

const LoginPage = () => {
  return (
   <Login />
  )
}

//I did some changes

export default LoginPage