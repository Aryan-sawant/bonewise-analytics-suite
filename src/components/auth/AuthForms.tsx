
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { AuthFormsProps } from './types';

const AuthForms = ({ defaultTab = 'login' }: AuthFormsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        
        <TabsContent value="signup">
          <SignupForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthForms;
