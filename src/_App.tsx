import React, { useState, useEffect } from 'react';
import { Calculator, Download, Info, Moon, Sun } from 'lucide-react';

const App = () => {
  const [ctc, setCtc] = useState('');
  const [calculationType, setCalculationType] = useState('monthly');
  const [wageType, setWageType] = useState('SKILLED');
  const [staffName, setStaffName] = useState('');
  const [designation, setDesignation] = useState('');
  const [includePF, setIncludePF] = useState(true);
  const [includeESI, setIncludeESI] = useState(true);
  const [includeTDS, setIncludeTDS] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [results, setResults] = useState(null);

  // Jammu & Kashmir Minimum Wages (Monthly - as per latest standards)
  const minimumWages = {
    'HIGHLY_SKILLED': 12500,
    'SKILLED': 11000,
    'SEMI_SKILLED': 9500,
    'UNSKILLED': 8500
  };

  const wageCategories = [
    { value: 'HIGHLY_SKILLED', label: 'Highly Skilled' },
    { value: 'SKILLED', label: 'Skilled' },
    { value: 'SEMI_SKILLED', label: 'Semi-Skilled' },
    { value: 'UNSKILLED', label: 'Unskilled' }
  ];

  // Income Tax Calculation for FY 2025-26 (New Tax Regime)
  const calculateTDS = (annualIncome) => {
    // Standard Deduction: ₹75,000
    const standardDeduction = 75000;
    const taxableIncome = Math.max(0, annualIncome - standardDeduction);
    
    let tax = 0;
    
    // New Tax Regime FY 2025-26
    // 0 - 4,00,000: 0%
    // 4,00,001 - 8,00,000: 5%
    // 8,00,001 - 12,00,000: 10%
    // 12,00,001 - 16,00,000: 15%
    // 16,00,001 - 20,00,000: 20%
    // 20,00,001 - 24,00,000: 25%
    // Above 24,00,000: 30%
    
    if (taxableIncome <= 400000) {
      tax = 0;
    } else if (taxableIncome <= 800000) {
      tax = (taxableIncome - 400000) * 0.05;
    } else if (taxableIncome <= 1200000) {
      tax = 20000 + (taxableIncome - 800000) * 0.10;
    } else if (taxableIncome <= 1600000) {
      tax = 60000 + (taxableIncome - 1200000) * 0.15;
    } else if (taxableIncome <= 2000000) {
      tax = 120000 + (taxableIncome - 1600000) * 0.20;
    } else if (taxableIncome <= 2400000) {
      tax = 200000 + (taxableIncome - 2000000) * 0.25;
    } else {
      tax = 300000 + (taxableIncome - 2400000) * 0.30;
    }
    
    // Add 4% Health & Education Cess
    tax = tax * 1.04;
    
    return {
      annualTax: tax,
      monthlyTDS: tax / 12,
      taxableIncome: taxableIncome,
      standardDeduction: standardDeduction
    };
  };

  const calculateSalary = (inputCTC, type, selectedWageType, pfEnabled, esiEnabled, tdsEnabled) => {
    if (!inputCTC || inputCTC <= 0) {
      setResults(null);
      return;
    }

    const monthlyCTC = type === 'annual' ? inputCTC / 12 : inputCTC;
    
    // CTC = Gross + Total Employer Cost
    // We need to calculate Gross first, then derive components
    
    // Iterative calculation to find Gross from CTC
    // CTC = Gross + (Employer PF + Employer ESI + EPF Admin + DLI)
    // EPF Admin & DLI = 0.5% of Gross each
    
    let gross = monthlyCTC / 1.15; // Initial estimate
    
    // Iterate to get accurate gross
    for (let i = 0; i < 10; i++) {
      const basicTemp = gross * 0.5;
      const hraTemp = basicTemp * 0.4;
      const pfBase = gross - hraTemp;
      const employerPF = pfEnabled ? Math.min(pfBase * 0.12, 1800) : 0;
      const employerESI = (esiEnabled && gross <= 21000) ? gross * 0.0325 : 0;
      const epfAdminCharges = pfEnabled ? Math.min((gross - hraTemp) * 0.005, 75) : 0;
      const dli = pfEnabled ? Math.min((gross - hraTemp) * 0.005, 75) : 0;
      const totalEmployerCost = employerPF + employerESI + epfAdminCharges + dli;
      gross = monthlyCTC - totalEmployerCost;
    }
    
    // 1. Basic Salary = 50% of Gross
    const basic = gross * 0.5;
    
    // 2. HRA = 40% of Basic (Jammu - Non-metro city as per new labour code)
    const hra = basic * 0.4;
    
    // 3. TA = 15% of Basic (Max ₹1,600)
    const taCalculated = basic * 0.15;
    const ta = Math.min(taCalculated, 1600);
    
    // 5. Other Allowances
    const otherAllowances = gross - (basic + hra + ta);
    
    // 6. PF Base (Gross - HRA)
    const pfBase = gross - hra;
    
    // Employee PF = 12% of PF Base (Max ₹1,800) - only if PF is enabled
    const employeePF = pfEnabled ? Math.min(pfBase * 0.12, 1800) : 0;
    
    // Employer PF = 12% of PF Base (Max ₹1,800) - only if PF is enabled
    const employerPF = pfEnabled ? Math.min(pfBase * 0.12, 1800) : 0;
    
    // 7. ESI (Only if Gross ≤ ₹21,000 and ESI is enabled)
    let employerESI = 0;
    let employeeESI = 0;
    
    if (esiEnabled && gross <= 21000) {
      employerESI = gross * 0.0325;
      employeeESI = gross * 0.0075;
    }
    
    // 8. EPF Admin Charges & DLI = 0.5% of (Gross - HRA) each (capped at ₹75) - only if PF is enabled
    const epfAdminCharges = pfEnabled ? Math.min((gross - hra) * 0.005, 75) : 0;
    const dli = pfEnabled ? Math.min((gross - hra) * 0.005, 75) : 0;
    
    // 9. Calculate TDS if enabled
    let tdsData = null;
    if (tdsEnabled) {
      const annualGross = gross * 12;
      tdsData = calculateTDS(annualGross);
    }
    
    // 10. Net In-Hand Salary
    const monthlyTDS = tdsEnabled && tdsData ? tdsData.monthlyTDS : 0;
    const netInHand = gross - (employeePF + employeeESI + monthlyTDS);
    
    // Get minimum wage for selected category
    const minWage = minimumWages[selectedWageType];
    
    // For minimum wage check: Basic + Allowances (except HRA)
    const wageForComparison = basic + ta + otherAllowances;
    
    return {
      earnings: {
        basic: basic,
        hra: hra,
        ta: ta,
        otherAllowances: otherAllowances,
        gross: gross
      },
      employerContributions: {
        employerPF: employerPF,
        employerESI: employerESI,
        epfAdminCharges: epfAdminCharges,
        dli: dli,
        total: employerPF + employerESI + epfAdminCharges + dli
      },
      employeeDeductions: {
        employeePF: employeePF,
        employeeESI: employeeESI,
        tds: monthlyTDS,
        total: employeePF + employeeESI + monthlyTDS
      },
      tdsDetails: tdsData,
      netInHand: netInHand,
      pfEnabled: pfEnabled,
      esiEnabled: esiEnabled,
      tdsEnabled: tdsEnabled,
      warnings: {
        esiExceeded: gross > 21000,
        pfCapped: pfEnabled && (pfBase * 0.12 > 1800),
        taCapped: taCalculated > 1600,
        epfAdminCapped: pfEnabled && ((gross - hra) * 0.005 > 75),
        dliCapped: pfEnabled && ((gross - hra) * 0.005 > 75),
        basicTooLow: basic < (gross * 0.5),
        basicTooHigh: basic > (gross * 0.5),
        hraIncorrect: hra !== (basic * 0.4),
        pfBaseIncorrect: pfBase !== (basic + otherAllowances),
        esiLimit: esiEnabled && gross > 21000 && gross <= 25000,
        gratuityApplicable: monthlyCTC >= 15000,
        minimumWageCheck: wageForComparison < minWage,
        minimumWageAmount: minWage,
        wageCategory: selectedWageType,
        actualWageAmount: wageForComparison
      }
    };
  };

  useEffect(() => {
    if (ctc) {
      const result = calculateSalary(parseFloat(ctc), calculationType, wageType, includePF, includeESI, includeTDS);
      setResults(result);
    }
  }, [ctc, calculationType, wageType, includePF, includeESI, includeTDS]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const downloadPDF = () => {
    if (!results) return;
    
    const printContent = document.createElement('div');
    
    // Build employer contributions rows
    let employerRows = '';
    if (results.pfEnabled) {
      employerRows += `
        <tr>
          <td>Employer PF</td>
          <td>${formatCurrency(results.employerContributions.employerPF)}</td>
          <td>${formatCurrency(results.employerContributions.employerPF * 12)}</td>
        </tr>
        <tr>
          <td>EPF Admin Charges</td>
          <td>${formatCurrency(results.employerContributions.epfAdminCharges)}</td>
          <td>${formatCurrency(results.employerContributions.epfAdminCharges * 12)}</td>
        </tr>
        <tr>
          <td>DLI</td>
          <td>${formatCurrency(results.employerContributions.dli)}</td>
          <td>${formatCurrency(results.employerContributions.dli * 12)}</td>
        </tr>
      `;
    }
    if (results.esiEnabled) {
      employerRows += `
        <tr>
          <td>Employer ESI</td>
          <td>${formatCurrency(results.employerContributions.employerESI)}</td>
          <td>${formatCurrency(results.employerContributions.employerESI * 12)}</td>
        </tr>
      `;
    }
    if (!results.pfEnabled && !results.esiEnabled) {
      employerRows = '<tr><td colspan="3" style="text-align: center; color: #999;">No employer contributions (PF & ESI disabled)</td></tr>';
    }
    
    // Build employee deduction rows
    let deductionRows = '';
    if (results.pfEnabled) {
      deductionRows += `
        <tr>
          <td>Employee PF</td>
          <td>${formatCurrency(results.employeeDeductions.employeePF)}</td>
          <td>${formatCurrency(results.employeeDeductions.employeePF * 12)}</td>
        </tr>
      `;
    }
    if (results.esiEnabled) {
      deductionRows += `
        <tr>
          <td>Employee ESI</td>
          <td>${formatCurrency(results.employeeDeductions.employeeESI)}</td>
          <td>${formatCurrency(results.employeeDeductions.employeeESI * 12)}</td>
        </tr>
      `;
    }
    if (results.tdsEnabled && results.tdsDetails) {
      deductionRows += `
        <tr>
          <td>TDS (Income Tax)</td>
          <td>${formatCurrency(results.tdsDetails.monthlyTDS)}</td>
          <td>${formatCurrency(results.tdsDetails.annualTax)}</td>
        </tr>
      `;
    }
    if (!results.pfEnabled && !results.esiEnabled && !results.tdsEnabled) {
      deductionRows = '<tr><td colspan="3" style="text-align: center; color: #999;">No deductions (PF, ESI & TDS disabled)</td></tr>';
    }
    
    // TDS breakdown section
    let tdsSection = '';
    if (results.tdsEnabled && results.tdsDetails) {
      tdsSection = `
        <div style="margin: 20px 0; padding: 15px; background: #FFF7ED; border-radius: 8px; border-left: 4px solid #F97316;">
          <h3 style="color: #F97316; margin-bottom: 10px;">📊 Income Tax (TDS) Breakdown - FY 2025-26</h3>
          <table style="width: 100%; border: none;">
            <tr>
              <td style="border: none; padding: 5px;"><strong>Annual Gross Income:</strong></td>
              <td style="border: none; padding: 5px; text-align: right;">${formatCurrency(results.earnings.gross * 12)}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 5px;"><strong>Standard Deduction:</strong></td>
              <td style="border: none; padding: 5px; text-align: right;">- ${formatCurrency(results.tdsDetails.standardDeduction)}</td>
            </tr>
            <tr style="border-top: 1px solid #ddd;">
              <td style="border: none; padding: 5px;"><strong>Taxable Income:</strong></td>
              <td style="border: none; padding: 5px; text-align: right;"><strong>${formatCurrency(results.tdsDetails.taxableIncome)}</strong></td>
            </tr>
            <tr>
              <td style="border: none; padding: 5px;"><strong>Annual Tax (with Cess):</strong></td>
              <td style="border: none; padding: 5px; text-align: right; color: #DC2626;"><strong>${formatCurrency(results.tdsDetails.annualTax)}</strong></td>
            </tr>
            <tr>
              <td style="border: none; padding: 5px;"><strong>Monthly TDS:</strong></td>
              <td style="border: none; padding: 5px; text-align: right; color: #DC2626;"><strong>${formatCurrency(results.tdsDetails.monthlyTDS)}</strong></td>
            </tr>
          </table>
          <p style="font-size: 10px; color: #666; margin-top: 10px;"><strong>Note:</strong> Tax calculated as per New Tax Regime FY 2025-26. Standard deduction: ₹75,000. Tax slabs: 0% (up to ₹4L), 5% (₹4-8L), 10% (₹8-12L), 15% (₹12-16L), 20% (₹16-20L), 25% (₹20-24L), 30% (above ₹24L). Includes 4% Health & Education Cess.</p>
        </div>
      `;
    }
    printContent.innerHTML = `
      <html>
        <head>
          <title>Salary Breakup - ${staffName || 'Employee'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #4F46E5; margin-bottom: 5px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
            .info-section { margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { font-weight: 600; color: #374151; }
            .value { color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #f3f4f6; font-weight: 600; color: #374151; }
            .section-header { background-color: #4F46E5; color: white; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f9fafb; }
            .net-salary { font-size: 20px; color: #4F46E5; font-weight: bold; margin: 20px 0; padding: 15px; background: #EEF2FF; border-radius: 8px; text-align: center; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .creator { text-align: right; font-size: 10px; color: #999; margin-top: 30px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>Salary Calculator <span style="font-size: 14px; color: #999;">v.1.53</span></h1>
          <div class="subtitle">Indian Payroll Standard - CTC Breakup (Jammu & Kashmir)</div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="label">Staff Name:</span>
              <span class="value">${staffName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Designation:</span>
              <span class="value">${designation || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Wage Type:</span>
              <span class="value">${wageCategories.find(w => w.value === wageType)?.label || wageType}</span>
            </div>
            <div class="info-row">
              <span class="label">CTC (${calculationType}):</span>
              <span class="value">${formatCurrency(parseFloat(ctc))}</span>
            </div>
            <div class="info-row">
              <span class="label">Generated Date:</span>
              <span class="value">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <table>
            <tr class="section-header">
              <th colspan="3">💰 EARNINGS</th>
            </tr>
            <tr>
              <th>Component</th>
              <th>Monthly</th>
              <th>Annual</th>
            </tr>
            <tr>
              <td>Basic Salary</td>
              <td>${formatCurrency(results.earnings.basic)}</td>
              <td>${formatCurrency(results.earnings.basic * 12)}</td>
            </tr>
            <tr>
              <td>HRA (40% of Basic)</td>
              <td>${formatCurrency(results.earnings.hra)}</td>
              <td>${formatCurrency(results.earnings.hra * 12)}</td>
            </tr>
            <tr>
              <td>Travel Allowance</td>
              <td>${formatCurrency(results.earnings.ta)}</td>
              <td>${formatCurrency(results.earnings.ta * 12)}</td>
            </tr>
            <tr>
              <td>Other Allowances</td>
              <td>${formatCurrency(results.earnings.otherAllowances)}</td>
              <td>${formatCurrency(results.earnings.otherAllowances * 12)}</td>
            </tr>
            <tr class="total-row">
              <td>Gross Salary</td>
              <td>${formatCurrency(results.earnings.gross)}</td>
              <td>${formatCurrency(results.earnings.gross * 12)}</td>
            </tr>
          </table>

          <table>
            <tr class="section-header">
              <th colspan="3">🏢 EMPLOYER CONTRIBUTIONS</th>
            </tr>
            <tr>
              <th>Component</th>
              <th>Monthly</th>
              <th>Annual</th>
            </tr>
            ${employerRows}
            <tr class="total-row">
              <td>Total Employer Cost</td>
              <td>${formatCurrency(results.employerContributions.total)}</td>
              <td>${formatCurrency(results.employerContributions.total * 12)}</td>
            </tr>
          </table>

          <table>
            <tr class="section-header">
              <th colspan="3">👤 EMPLOYEE DEDUCTIONS</th>
            </tr>
            <tr>
              <th>Component</th>
              <th>Monthly</th>
              <th>Annual</th>
            </tr>
            ${deductionRows}
            <tr class="total-row">
              <td>Total Deductions</td>
              <td>${formatCurrency(results.employeeDeductions.total)}</td>
              <td>${formatCurrency(results.employeeDeductions.total * 12)}</td>
            </tr>
          </table>

          ${tdsSection}

          <div class="net-salary">
            ✅ NET IN-HAND SALARY<br>
            Monthly: ${formatCurrency(results.netInHand)} | Annual: ${formatCurrency(results.netInHand * 12)}
          </div>

          <div class="footer">
            <p><strong>Note:</strong> This is a system-generated salary breakup based on Indian payroll standards and Jammu & Kashmir regulations.</p>
            <p>CTC = Gross + Total Employer Cost | Basic = 50% of Gross | HRA = 40% of Basic (J&K Non-Metro)</p>
            <p>EPF Admin & DLI = 0.5% each of (Gross - HRA), capped at ₹75 | Minimum Wage Check: Basic + Allowances (excluding HRA) must meet J&K wage standards</p>
          </div>

          <div class="creator">Created by Bibin Jacob</div>
          <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #999;">Copyright © 2026, All Rights Reserved</div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const themeClasses = darkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-900';
  
  const cardClasses = darkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen ${themeClasses} p-4 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Calculator className="w-10 h-10 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold">Salary Calculator <span className="text-sm text-gray-400">v.1.53</span></h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Indian Payroll Standard - CTC Breakup
              </p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-md`}
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* Input Section */}
        <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mb-6`}>
          <h2 className="text-xl font-semibold mb-4">Input Details</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Staff Name
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Enter staff name"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 outline-none`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Enter designation"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 outline-none`}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                CTC Amount (₹)
              </label>
              <input
                type="number"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                placeholder="Enter CTC"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 outline-none`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Calculation Type
              </label>
              <select
                value={calculationType}
                onChange={(e) => setCalculationType(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 outline-none`}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Wage Type (J&K)
              </label>
              <select
                value={wageType}
                onChange={(e) => setWageType(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 outline-none`}
              >
                {wageCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePF}
                onChange={(e) => setIncludePF(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium">Include PF (Provident Fund)</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeESI}
                onChange={(e) => setIncludeESI(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium">Include ESI (Employee State Insurance)</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTDS}
                onChange={(e) => setIncludeTDS(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium">Include TDS (Income Tax Deduction)</span>
            </label>
          </div>

          {results?.warnings && (
            <div className="mt-4 space-y-2">
              {results.warnings.esiExceeded && (
                <div className="flex items-start gap-2 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Gross salary exceeds ₹21,000 - ESI not applicable</span>
                </div>
              )}
              {results.warnings.esiLimit && (
                <div className="flex items-start gap-2 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span><strong>New Labour Code Alert:</strong> ESI wage ceiling may be revised to ₹25,000. Current gross is between ₹21,000-₹25,000</span>
                </div>
              )}
              {results.warnings.pfCapped && (
                <div className="flex items-start gap-2 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>PF contribution capped at ₹1,800 per month</span>
                </div>
              )}
              {results.warnings.taCapped && (
                <div className="flex items-start gap-2 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Travel Allowance capped at ₹1,600 per month</span>
                </div>
              )}
              {results.warnings.epfAdminCapped && (
                <div className="flex items-start gap-2 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>EPF Admin Charges capped at ₹75 per month</span>
                </div>
              )}
              {results.warnings.dliCapped && (
                <div className="flex items-start gap-2 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>DLI capped at ₹75 per month</span>
                </div>
              )}
              {(results.earnings.basic < results.earnings.gross * 0.5) && (
                <div className="flex items-start gap-2 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span><strong>New Labour Code Non-Compliance:</strong> Basic salary must be at least 50% of gross salary. Current: {((results.earnings.basic / results.earnings.gross) * 100).toFixed(1)}%</span>
                </div>
              )}
              {results.warnings.hraIncorrect && (
                <div className="flex items-start gap-2 p-3 bg-orange-100 text-orange-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span><strong>Jammu & Kashmir Standard:</strong> HRA is set to 40% of Basic for non-metro cities as per new labour code</span>
                </div>
              )}
              {results.warnings.minimumWageCheck && (
                <div className="flex items-start gap-2 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span><strong>J&K Minimum Wage Alert:</strong> Basic + Allowances (excluding HRA) = ₹{results.warnings.actualWageAmount.toFixed(0)} is below the minimum wage for {wageCategories.find(w => w.value === results.warnings.wageCategory)?.label} category (₹{results.warnings.minimumWageAmount}). Please ensure compliance with J&K minimum wage standards.</span>
                </div>
              )}
              {results.warnings.gratuityApplicable && (
                <div className="flex items-start gap-2 p-3 bg-green-100 text-green-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span><strong>Gratuity Applicable:</strong> Employee is eligible for gratuity benefits under the new labour code (minimum wage threshold met)</span>
                </div>
              )}
              {results.earnings.otherAllowances > (results.earnings.gross * 0.5) && (
                <div className="flex items-start gap-2 p-3 bg-orange-100 text-orange-800 rounded-lg text-sm">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span><strong>New Labour Code Warning:</strong> Allowances exceed 50% of gross salary. This may impact PF calculation base under the new wage code</span>
                </div>
              )}
            </div>
          )}
        </div>

        {results && (
          <>
            {/* Results Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Monthly Column */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-center text-indigo-600">Monthly Breakup</h3>
                
                {/* Earnings */}
                <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mb-4`}>
                  <h3 className="text-lg font-semibold mb-4 text-green-600">💰 Earnings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Basic Salary</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.basic)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>HRA</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.hra)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Travel Allowance</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.ta)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Other Allowances</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.otherAllowances)}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Gross Salary</span>
                        <span className="font-bold text-green-600">{formatCurrency(results.earnings.gross)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employer Contributions */}
                <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mb-4`}>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">🏢 Employer Contributions</h3>
                  <div className="space-y-3">
                    {results.pfEnabled && (
                      <>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Employer PF</span>
                          <span className="font-semibold">{formatCurrency(results.employerContributions.employerPF)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>EPF Admin Charges</span>
                          <span className="font-semibold">{formatCurrency(results.employerContributions.epfAdminCharges)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>DLI</span>
                          <span className="font-semibold">{formatCurrency(results.employerContributions.dli)}</span>
                        </div>
                      </>
                    )}
                    {results.esiEnabled && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Employer ESI</span>
                        <span className="font-semibold">{formatCurrency(results.employerContributions.employerESI)}</span>
                      </div>
                    )}
                    {!results.pfEnabled && !results.esiEnabled && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No employer contributions (PF & ESI disabled)
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total Employer Cost</span>
                        <span className="font-bold text-blue-600">{formatCurrency(results.employerContributions.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee Deductions */}
                <div className={`${cardClasses} rounded-xl shadow-lg border p-6`}>
                  <h3 className="text-lg font-semibold mb-4 text-red-600">👤 Employee Deductions</h3>
                  <div className="space-y-3">
                    {results.pfEnabled && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Employee PF</span>
                        <span className="font-semibold">{formatCurrency(results.employeeDeductions.employeePF)}</span>
                      </div>
                    )}
                    {results.esiEnabled && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Employee ESI</span>
                        <span className="font-semibold">{formatCurrency(results.employeeDeductions.employeeESI)}</span>
                      </div>
                    )}
                    {results.tdsEnabled && results.tdsDetails && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>TDS (Income Tax)</span>
                        <span className="font-semibold">{formatCurrency(results.employeeDeductions.tds)}</span>
                      </div>
                    )}
                    {!results.pfEnabled && !results.esiEnabled && !results.tdsEnabled && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No deductions (PF, ESI & TDS disabled)
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total Deductions</span>
                        <span className="font-bold text-red-600">{formatCurrency(results.employeeDeductions.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Annual Column */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-center text-purple-600">Annual Breakup</h3>
                
                {/* Earnings */}
                <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mb-4`}>
                  <h3 className="text-lg font-semibold mb-4 text-green-600">💰 Earnings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Basic Salary</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.basic * 12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>HRA</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.hra * 12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Travel Allowance</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.ta * 12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Other Allowances</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.otherAllowances * 12)}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Gross Salary</span>
                        <span className="font-bold text-green-600">{formatCurrency(results.earnings.gross * 12)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employer Contributions */}
                <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mb-4`}>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">🏢 Employer Contributions</h3>
                  <div className="space-y-3">
                    {results.pfEnabled && (
                      <>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Employer PF</span>
                          <span className="font-semibold">{formatCurrency(results.employerContributions.employerPF * 12)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>EPF Admin Charges</span>
                          <span className="font-semibold">{formatCurrency(results.employerContributions.epfAdminCharges * 12)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>DLI</span>
                          <span className="font-semibold">{formatCurrency(results.employerContributions.dli * 12)}</span>
                        </div>
                      </>
                    )}
                    {results.esiEnabled && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Employer ESI</span>
                        <span className="font-semibold">{formatCurrency(results.employerContributions.employerESI * 12)}</span>
                      </div>
                    )}
                    {!results.pfEnabled && !results.esiEnabled && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No employer contributions (PF & ESI disabled)
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total Employer Cost</span>
                        <span className="font-bold text-blue-600">{formatCurrency(results.employerContributions.total * 12)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee Deductions */}
                <div className={`${cardClasses} rounded-xl shadow-lg border p-6`}>
                  <h3 className="text-lg font-semibold mb-4 text-red-600">👤 Employee Deductions</h3>
                  <div className="space-y-3">
                    {results.pfEnabled && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Employee PF</span>
                        <span className="font-semibold">{formatCurrency(results.employeeDeductions.employeePF * 12)}</span>
                      </div>
                    )}
                    {results.esiEnabled && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Employee ESI</span>
                        <span className="font-semibold">{formatCurrency(results.employeeDeductions.employeeESI * 12)}</span>
                      </div>
                    )}
                    {results.tdsEnabled && results.tdsDetails && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>TDS (Income Tax)</span>
                        <span className="font-semibold">{formatCurrency(results.tdsDetails.annualTax)}</span>
                      </div>
                    )}
                    {!results.pfEnabled && !results.esiEnabled && !results.tdsEnabled && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No deductions (PF, ESI & TDS disabled)
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total Deductions</span>
                        <span className="font-bold text-red-600">{formatCurrency(results.employeeDeductions.total * 12)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net In-Hand */}
            <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mb-6`}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1">✅ Net In-Hand Salary (Monthly)</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    Amount credited to employee account per month
                  </p>
                  <div className="text-3xl font-bold text-indigo-600">
                    {formatCurrency(results.netInHand)}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">✅ Net In-Hand Salary (Annual)</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    Total annual take-home salary
                  </p>
                  <div className="text-3xl font-bold text-purple-600">
                    {formatCurrency(results.netInHand * 12)}
                  </div>
                </div>
              </div>
            </div>

            {/* TDS Details Section */}
            {results.tdsEnabled && results.tdsDetails && (
              <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mb-6`}>
                <h3 className="text-xl font-semibold mb-4 text-orange-600">📊 Income Tax (TDS) Breakdown - FY 2025-26</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Annual Gross Income:</span>
                      <span className="font-semibold">{formatCurrency(results.earnings.gross * 12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Standard Deduction:</span>
                      <span className="font-semibold">- {formatCurrency(results.tdsDetails.standardDeduction)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Taxable Income:</span>
                      <span className="font-bold">{formatCurrency(results.tdsDetails.taxableIncome)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Annual Tax (with Cess):</span>
                      <span className="font-semibold text-red-600">{formatCurrency(results.tdsDetails.annualTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Monthly TDS:</span>
                      <span className="font-semibold text-red-600">{formatCurrency(results.tdsDetails.monthlyTDS)}</span>
                    </div>
                  </div>
                </div>
                <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> Tax calculated as per New Tax Regime FY 2025-26 with standard deduction of ₹75,000. 
                    Rates: 0% up to ₹4L, 5% (₹4-8L), 10% (₹8-12L), 15% (₹12-16L), 20% (₹16-20L), 25% (₹20-24L), 30% (above ₹24L). 
                    Includes 4% Health & Education Cess.
                  </p>
                </div>
              </div>
            )}

            {/* Creator Credit */}
            <div className="text-right mb-2">
              <p className="text-xs text-gray-400">Created by Bibin Jacob</p>
            </div>

            {/* Download Button */}
            <div className="flex justify-center">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Salary Breakup
              </button>
            </div>
          </>
        )}

        {/* Calculation Info */}
        <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mt-6`}>
          <h3 className="text-lg font-semibold mb-3">📋 Calculation Assumptions</h3>
          <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• CTC = Gross + Total Employer Cost (Employer PF + Employer ESI + EPF Admin + DLI)</li>
            <li>• Basic Salary: 50% of Gross</li>
            <li>• HRA: 40% of Basic Salary (Jammu & Kashmir - Non-metro city standard)</li>
            <li>• Travel Allowance: 15% of Basic (capped at ₹1,600)</li>
            <li>• PF: 12% each for employee and employer (capped at ₹1,800)</li>
            <li>• ESI: Applicable only if Gross ≤ ₹21,000 (Employee: 0.75%, Employer: 3.25%)</li>
            <li>• EPF Admin Charges & DLI: 0.5% each of (Gross - HRA) (capped at ₹75)</li>
            <li>• Minimum Wages vary by skill category as per J&K standards</li>
          </ul>
        </div>

        {/* New Labour Code Compliance Info */}
        <div className={`${cardClasses} rounded-xl shadow-lg border p-6 mt-6`}>
          <h3 className="text-lg font-semibold mb-3 text-indigo-600">⚖️ New Labour Code Compliance Guidelines (J&K)</h3>
          <div className={`space-y-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div>
              <p className="font-semibold text-base mb-1">Key Requirements Under New Wage Code:</p>
              <ul className="space-y-2 ml-4">
                <li>• <strong>Basic Salary:</strong> Must be minimum 50% of gross salary (mandatory)</li>
                <li>• <strong>Allowances Cap:</strong> Total allowances cannot exceed 50% of gross salary</li>
                <li>• <strong>HRA Limit:</strong> 40% of Basic for Jammu & Kashmir (non-metro classification)</li>
                <li>• <strong>PF Base:</strong> Calculated on Basic + Dearness Allowance (all allowances may be included)</li>
                <li>• <strong>ESI Wage Ceiling:</strong> Current ₹21,000 (may be revised to ₹25,000)</li>
                <li>• <strong>J&K Minimum Wages (Monthly):</strong>
                  <ul className="ml-4 mt-1">
                    <li>- Highly Skilled: ₹{minimumWages.HIGHLY_SKILLED.toLocaleString('en-IN')}</li>
                    <li>- Skilled: ₹{minimumWages.SKILLED.toLocaleString('en-IN')}</li>
                    <li>- Semi-Skilled: ₹{minimumWages.SEMI_SKILLED.toLocaleString('en-IN')}</li>
                    <li>- Unskilled: ₹{minimumWages.UNSKILLED.toLocaleString('en-IN')}</li>
                  </ul>
                </li>
                <li>• <strong>Gratuity:</strong> Applicable for all employees meeting minimum wage thresholds</li>
              </ul>
            </div>
            <div className="pt-3 border-t">
              <p className="font-semibold">Important Notes for J&K:</p>
              <ul className="space-y-1 ml-4 mt-1">
                <li>• The new labour codes consolidate 29 central labour laws into 4 codes</li>
                <li>• J&K follows non-metro city classification for HRA calculations</li>
                <li>• Minimum wage rates are subject to periodic revisions by the J&K government</li>
                <li>• Employers must ensure compliance with both central and J&K state labour laws</li>
                <li>• This calculator follows standard interpretations; consult legal/HR experts for specific cases</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="text-center mt-8 mb-4">
          <p className="text-xs text-gray-400">Copyright © 2026, All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};

export default App;
