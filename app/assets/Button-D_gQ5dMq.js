import{j as a}from"./index-CNj45q6A.js";const i={primary:"bg-[#a6ed2a] text-[#080c16] hover:bg-[#b8f247] font-medium",secondary:"bg-[#0a101d] text-gray-300 border border-[#1d2839] hover:text-white hover:border-[#404040]",ghost:"text-gray-400 hover:text-white hover:bg-[#0a101d]",danger:"bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"},x={sm:"px-3 py-1.5 text-xs rounded-lg gap-1.5",md:"px-4 py-2 text-sm rounded-lg gap-2",lg:"px-6 py-3 text-base rounded-xl gap-2"};function p({variant:r="primary",size:t="md",icon:o,children:d,className:n="",disabled:e,...s}){return a.jsxs("button",{className:`
        inline-flex items-center justify-center transition-colors
        ${i[r]}
        ${x[t]}
        ${e?"opacity-50 cursor-not-allowed":"cursor-pointer"}
        ${n}
      `.trim(),disabled:e,...s,children:[o,d]})}export{p as B};
