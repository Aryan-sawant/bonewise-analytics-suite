
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { AuthFormsProps } from './types';

const AuthForms = ({ defaultTab = 'login' }: AuthFormsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
        <TabsList className="grid w-full grid-cols-2 mb-4 animate-scale-in">
          <TabsTrigger value="login" className="transition-all duration-300">Login</TabsTrigger>
          <TabsTrigger value="signup" className="transition-all duration-300">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login" className="animate-fade-in">
          <LoginForm />
        </TabsContent>
        
        <TabsContent value="signup" className="animate-fade-in">
          <SignupForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthForms;
