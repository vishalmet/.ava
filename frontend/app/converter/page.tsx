"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Copy, Download, FileCode2, Sparkles, ArrowLeft, Rocket, Upload, Key, Loader2, Edit3, Eye, EyeOff } from "lucide-react"
import { brand } from "@/lib/brand"
import CodeEditor from "@/components/code-editor"

export default function ConverterPage() {
  const [avaCode, setAvaCode] = useState(`// Sample .ava program
function transfer(to: address, amount: u64) {
    require(balance[msg.sender] >= amount, "Insufficient balance");
    balance[msg.sender] -= amount;
    balance[to] += amount;
    emit Transfer(msg.sender, to, amount);
}

function getBalance(account: address) -> u64 {
    return balance[account];
}`)

  const [targetLanguage, setTargetLanguage] = useState("sol")
  const [convertedCode, setConvertedCode] = useState("")
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [isConverting, setIsConverting] = useState(false)
  const [conversionError, setConversionError] = useState("")
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const languages = [
    { value: "sol", label: "Solidity (.sol)", extension: ".sol", apiValue: "solidity" },
    { value: "cairo", label: "Cairo (.cairo)", extension: ".cairo", apiValue: "cairo" },
    { value: "rs", label: "Rust (.rs)", extension: ".rs", apiValue: "rust" }
  ]

  // Check localStorage for API key on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('say_my_name')
    if (storedApiKey) {
      setApiKey(storedApiKey)
      setHasStoredKey(true)
    }
  }, [])

  const mockConversions = {
    sol: `// Converted to Solidity
pragma solidity ^0.8.0;

contract AvaContract {
    mapping(address => uint64) public balance;
    
    event Transfer(address indexed from, address indexed to, uint64 amount);
    
    function transfer(address to, uint64 amount) public {
        require(balance[msg.sender] >= amount, "Insufficient balance");
        balance[msg.sender] -= amount;
        balance[to] += amount;
        emit Transfer(msg.sender, to, amount);
    }
    
    function getBalance(address account) public view returns (uint64) {
        return balance[account];
    }
}`,
    cairo: `// Converted to Cairo
%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.syscalls import get_caller_address

@storage_var
func balance(account: felt) -> (res: felt) {
}

@event
func Transfer(from_: felt, to: felt, amount: felt) {
}

@external
func transfer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    to: felt, amount: felt
) {
    let (caller) = get_caller_address();
    let (caller_balance) = balance.read(caller);
    
    with_attr error_message("Insufficient balance") {
        assert_le(amount, caller_balance);
    }
    
    balance.write(caller, caller_balance - amount);
    let (to_balance) = balance.read(to);
    balance.write(to, to_balance + amount);
    
    Transfer.emit(caller, to, amount);
    return ();
}

@view
func getBalance{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    account: felt
) -> (balance: felt) {
    let (res) = balance.read(account);
    return (balance=res);
}`,
    rs: `// Converted to Rust
use std::collections::HashMap;

pub struct AvaContract {
    balance: HashMap<String, u64>,
}

impl AvaContract {
    pub fn new() -> Self {
        Self {
            balance: HashMap::new(),
        }
    }
    
    pub fn transfer(&mut self, from: &str, to: &str, amount: u64) -> Result<(), String> {
        let from_balance = self.balance.get(from).unwrap_or(&0);
        
        if *from_balance < amount {
            return Err("Insufficient balance".to_string());
        }
        
        self.balance.insert(from.to_string(), from_balance - amount);
        let to_balance = self.balance.get(to).unwrap_or(&0);
        self.balance.insert(to.to_string(), to_balance + amount);
        
        println!("Transfer: {} -> {} ({})", from, to, amount);
        Ok(())
    }
    
    pub fn get_balance(&self, account: &str) -> u64 {
        *self.balance.get(account).unwrap_or(&0)
    }
}`
  }

  const handleConvert = async () => {
    // Clear any previous errors
    setConversionError("")
    
    // Check if API key exists in localStorage
    const storedApiKey = localStorage.getItem('say_my_name')
    
    if (!storedApiKey && !apiKey) {
      // Open modal to ask for API key
      setIsModalOpen(true)
      setShowApiKey(false) // Reset to hidden when opening modal
      return
    }
    
    // Use stored API key or current apiKey state
    const keyToUse = storedApiKey || apiKey
    await convertCode(keyToUse)
  }

  const convertCode = async (apiKeyToUse: string) => {
    setIsConverting(true)
    setConversionError("")
    
    try {
      const targetLang = languages.find(l => l.value === targetLanguage)?.apiValue || "solidity"
      
      const response = await fetch('https://ava-api.vercel.app/convert-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKeyToUse,
          source_code: `<${avaCode}>`,
          target_language: targetLang
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setConvertedCode(data.code || data.converted_code || data.result || "Conversion completed but no code returned")
      
    } catch (error) {
      console.error('Conversion error:', error)
      setConversionError(error instanceof Error ? error.message : 'Failed to convert code. Please try again.')
      
      // If error is related to API key, clear it from storage and show modal
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('401'))) {
        localStorage.removeItem('say_my_name')
        setApiKey("")
        setHasStoredKey(false)
        setIsModalOpen(true)
      }
    } finally {
      setIsConverting(false)
    }
  }

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      setConversionError("Please enter a valid API key")
      return
    }

    // Save API key to localStorage
    localStorage.setItem('say_my_name', apiKey.trim())
    setHasStoredKey(true)
    setIsModalOpen(false)
    
    // Start conversion
    await convertCode(apiKey.trim())
  }

  const editKey = () => {
    // Open modal to edit existing key
    setIsModalOpen(true)
    setConversionError("")
    setShowApiKey(false) // Reset to hidden when opening modal
  }

  // Extract contract name from code for filename
  const getContractName = (code: string): string => {
    if (targetLanguage === "sol") {
      const match = code.match(/contract\s+(\w+)/);
      return match ? match[1] : "Contract";
    } else if (targetLanguage === "cairo") {
      const match = code.match(/#\[contract\]\s*mod\s+(\w+)/) || code.match(/mod\s+(\w+)/);
      return match ? match[1] : "Contract";
    } else if (targetLanguage === "rs") {
      const match = code.match(/struct\s+(\w+)/) || code.match(/impl\s+(\w+)/);
      return match ? match[1] : "Contract";
    }
    return "Contract";
  }

  const handleDeploy = async () => {
    if (!convertedCode) {
      setDeploymentStatus("Please convert code first");
      setTimeout(() => setDeploymentStatus(""), 3000);
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus("Deploying to Avalanche...");

    try {
      // Mock deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const contractName = getContractName(convertedCode);
      const mockAddress = "0x" + Math.random().toString(16).substr(2, 40);
      
      setDeploymentStatus(`✅ ${contractName} deployed successfully at ${mockAddress}`);
      setTimeout(() => setDeploymentStatus(""), 10000);
    } catch (error) {
      setDeploymentStatus("❌ Deployment failed. Please try again.");
      setTimeout(() => setDeploymentStatus(""), 5000);
    } finally {
      setIsDeploying(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadCode = (code: string, extension: string) => {
    const contractName = getContractName(code);
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contractName}${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation Header */}
      <motion.header 
        className="border-b bg-white/90 backdrop-blur-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <motion.div
                  className="h-8 w-8 rounded-md shadow-sm"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                />
                <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-rose-500" aria-hidden="true" />
              </div>
              <span className="font-semibold text-lg group-hover:text-rose-600 transition-colors">.ava</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {hasStoredKey && (
                <Button
                  onClick={editKey}
                  size="sm"
                  variant="outline"
                  disabled={isConverting}
                  className="border font-medium hover:bg-neutral-50 transition-all duration-300"
                >
                  <Edit3 className="mr-2 h-3 w-3" />
                  Edit Key
                </Button>
              )}
              
              <Link 
                href="/" 
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-rose-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Header */}
      <motion.div 
        className="border-b bg-white/90 backdrop-blur-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="container px-4 py-8">
          <div className="text-center">
            <Badge variant="secondary" className="border-orange-200 bg-orange-50 text-rose-700 mb-4">
              <FileCode2 className="h-3 w-3 mr-1" />
              Code Converter
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              >
                .ava
              </span>{" "}
              to Any Language
            </h1>
            <p className="mx-auto mt-4 max-w-[65ch] text-lg text-neutral-600">
              Convert your .ava programs to Solidity, Cairo, or Rust.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container px-4 py-12">
        <motion.div 
          className="grid gap-8 lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Input Side - .ava Code */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <CodeEditor
              value={avaCode}
              onChange={setAvaCode}
              language="ava"
              title=".ava Program"
              badge="Input"
              placeholder="Enter your .ava code here..."
              onCopy={() => copyToClipboard(avaCode)}
            />
          </div>

          {/* Output Side - Converted Code */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <CodeEditor
              value={convertedCode}
              language={targetLanguage as "sol" | "cairo" | "rs"}
              title="Converted Code"
              badge="Output"
              placeholder="Converted code will appear here..."
              readOnly
              showLanguageSelector={true}
              languageOptions={languages}
              onLanguageChange={setTargetLanguage}
              onCopy={() => copyToClipboard(convertedCode)}
              onDownload={() => downloadCode(convertedCode, languages.find(l => l.value === targetLanguage)?.extension || '.txt')}
              downloadExtension={languages.find(l => l.value === targetLanguage)?.extension}
            />
          </div>
        </motion.div>

        {/* Convert & Deploy Buttons */}
        <motion.div 
          className="flex flex-col items-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex gap-4">
            <Button
              onClick={handleConvert}
              size="lg"
              disabled={isConverting}
              className="text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
              }}
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Convert to {languages.find(l => l.value === targetLanguage)?.label}
                </>
              )}
            </Button>

            {convertedCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  onClick={handleDeploy}
                  size="lg"
                  variant="outline"
                  disabled={isDeploying}
                  className="border-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    borderColor: brand.colors.primaryFrom,
                    color: brand.colors.primaryFrom,
                  }}
                >
                  {isDeploying ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Deploy to Avalanche
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Deployment Status */}
          {deploymentStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                deploymentStatus.includes('✅') 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : deploymentStatus.includes('❌')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {deploymentStatus}
            </motion.div>
          )}

          {/* Conversion Error */}
          {conversionError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200"
            >
              {conversionError}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* API Key Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {hasStoredKey ? (
                <>
                  <Edit3 className="h-5 w-5 text-rose-500" />
                  Edit Groq API Key
                </>
              ) : (
                <>
                  <Key className="h-5 w-5 text-rose-500" />
                  Groq API Key Required
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {hasStoredKey 
                ? "Update your Groq API key. The new key will be securely stored locally and replace the existing one."
                : "To convert your .ava code, please enter your Groq API key. It will be securely stored locally for future use."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Groq API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApiKeySubmit()
                    }
                  }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-500" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-neutral-500">
                Get your API key from{' '}
                <a 
                  href="https://console.groq.com/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:text-rose-600 underline"
                >
                  Groq Console
                </a>
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApiKeySubmit}
                disabled={!apiKey.trim() || isConverting}
                className="flex-1 text-white"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                }}
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : hasStoredKey ? (
                  'Update & Convert'
                ) : (
                  'Save & Convert'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
