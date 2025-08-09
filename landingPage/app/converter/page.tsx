"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Copy, Download, FileCode2, Sparkles, ArrowLeft } from "lucide-react"
import { brand } from "@/lib/brand"

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

  const languages = [
    { value: "sol", label: "Solidity (.sol)", extension: ".sol" },
    { value: "cairo", label: "Cairo (.cairo)", extension: ".cairo" },
    { value: "rs", label: "Rust (.rs)", extension: ".rs" }
  ]

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

  const handleConvert = () => {
    setConvertedCode(mockConversions[targetLanguage as keyof typeof mockConversions])
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadCode = (code: string, extension: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted_code${extension}`
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
            
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-rose-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
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
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
                  }}
                />
                <h3 className="font-semibold text-lg">.ava Program</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                Input
              </Badge>
            </div>
            <div className="relative">
              <textarea
                value={avaCode}
                onChange={(e) => setAvaCode(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm bg-neutral-50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent"
                placeholder="Enter your .ava code here..."
                spellCheck={false}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(avaCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Output Side - Converted Code */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <h3 className="font-semibold text-lg">Converted Code</h3>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-xs">
                Output
              </Badge>
            </div>
            
            <div className="relative">
              <textarea
                value={convertedCode}
                readOnly
                className="w-full h-96 p-4 font-mono text-sm bg-neutral-50 border rounded-lg resize-none focus:outline-none"
                placeholder="Converted code will appear here..."
                spellCheck={false}
              />
              {convertedCode && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(convertedCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadCode(convertedCode, languages.find(l => l.value === targetLanguage)?.extension || '.txt')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Convert Button */}
        <motion.div 
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button
            onClick={handleConvert}
            size="lg"
            className="text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              backgroundImage: `linear-gradient(90deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
            }}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Convert to {languages.find(l => l.value === targetLanguage)?.label}
          </Button>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="mt-16 grid gap-6 md:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {[
            {
              title: "Proof of Execution",
              desc: "Maintains verification properties across all target languages"
            },
            {
              title: "Syntax Preservation",
              desc: "Logic and functionality preserved in target language idioms"
            },
            {
              title: "Avalanche Optimized",
              desc: "Generated code optimized for Avalanche network deployment"
            }
          ].map((feature, i) => (
            <Card key={i} className="p-6 text-center">
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-neutral-600">{feature.desc}</p>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
