import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "@/components/ui/button";
// import { toast } from "@/components/ui/toast"
import { toast } from "sonner"
// Add this line instead
import axios from "axios";

import { Toaster } from "@/components/ui/sonner"

import { BACKEND_URL } from "@/lib/config";
import { useNavigate } from "react-router";

export function Form(){
  const [github,setgithub]=useState("")
  const [loading,setloading]=useState(false)
  const navigate=useNavigate()
  // const [linkedin,setlinkedin]=useState("")
  async function onsubmit(){
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/;
    if(!github || !githubRegex.test(github)){
      toast("Please Provide valid github urls")
      return
    }
    setloading(true);
    try {
      const response=await axios.post(`${BACKEND_URL}/api/v1/pre-interview`,{
        github
      })
      navigate(`/interview/${response.data.id}`);
    } catch (e: any) {
      console.error(e);
      toast("Error starting interview. Please check if the backend is running.");
    } finally {
      setloading(false);
    }
  }
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-background relative font-sans select-none">
        {/* Futuristic Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Dynamic Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        
        {/* Centered Glassmorphic Card */}
        <div className="z-10 w-full max-w-lg p-10 rounded-3xl bg-card border border-border shadow-[0_0_80px_-15px_rgba(99,102,241,0.15)] backdrop-blur-2xl flex flex-col items-center animate-float">
          
          {/* Logo Badge */}
          <div className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold tracking-widest text-primary font-display uppercase animate-pulse">
            Next-Gen Autonomous Agent
          </div>
          
          {/* Headline */}
          <div className="mb-8 text-center space-y-3">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              AI Technical Interviewer
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto font-sans leading-relaxed">
              Start your automated coding and system design session. Please enter your GitHub URL to sync projects.
            </p>
          </div>
          
          <div className="w-full space-y-6"> 
            {/* Input Container */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30 group-focus-within:opacity-70 group-hover:opacity-50 transition duration-500" />
              <Input 
                className="relative bg-background/80 border-border text-foreground placeholder:text-muted-foreground/50 h-14 px-5 rounded-2xl focus-visible:ring-primary/40 focus-visible:ring-[3px] focus-visible:border-primary transition-all text-base font-medium shadow-inner"
                placeholder="https://github.com/your-username" 
                value={github}
                onChange={e=>setgithub(e.target.value)} 
              />  
            </div>
            
            {/* Start Button */}
            <Button 
              className="w-full h-14 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_40px_rgba(99,102,241,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 cursor-pointer font-display tracking-wide uppercase"
              disabled={loading} 
              onClick={onsubmit}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Generating Workspace...
                </div>
              ) : "Initialize Session"}
            </Button>
          </div>
        </div>
      </div>
    );
}