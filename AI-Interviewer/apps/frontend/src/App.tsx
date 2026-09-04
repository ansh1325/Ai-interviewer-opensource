import { useState } from "react";
import { Form } from "./components/Form";
import { Interview } from "./components/Interview";
// import { Toaster } from "@/components/ui/toast"
// import { toast } from "sonner"
// // Add this line instead
import { Toaster } from "@/components/ui/sonner"
import {BrowserRouter,Routes, Route } from 'react-router'
import './index.css'
import { Result } from "./components/Result"; // 👈 Explicitly added the import path

export function App() {
  const [page, setpage] = useState<"form" | "result" | "interview">("form");

  return (
    <>
      <Toaster />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Form/>}/>
        <Route path="/interview/:interviewId" element={<Interview/>}/>
        <Route path="/result/:interviewId" element={<Result/>}/>
      </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
