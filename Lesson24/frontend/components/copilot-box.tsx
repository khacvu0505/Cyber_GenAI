"use client";

import { LoaderCircle, SendHorizontal, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function CopilotBox({
  disabled,
  prompt,
  onPromptChange,
  onSubmit,
}: {
  disabled: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
}) {
  const [localPrompt, setLocalPrompt] = useState(prompt);

  useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = localPrompt.trim();
    if (value) onSubmit(value);
  };

  return (
    <form className="rounded-lg border border-[#30394a] bg-[#151922] p-3 shadow-xl" onSubmit={submit}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#f2c94c]">
        <Sparkles size={15} />
        Ask Copilot
      </div>
      <div className="flex gap-2">
        <textarea
          className="min-h-20 flex-1 resize-none rounded-md border border-[#334052] bg-[#0f131a] px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-[#596272] focus:border-[#63d5ca]"
          disabled={disabled}
          onChange={(event) => {
            setLocalPrompt(event.target.value);
            onPromptChange(event.target.value);
          }}
          placeholder="Ví dụ: Tạo dashboard doanh thu theo tháng, top khách hàng và sản phẩm bán chạy"
          value={localPrompt}
        />
        <button className="grid w-12 place-items-center rounded-md bg-[#63d5ca] text-[#081211] hover:bg-[#85e7df]" disabled={disabled || !localPrompt.trim()} type="submit" aria-label="Send prompt">
          {disabled ? <LoaderCircle className="animate-spin" size={18} /> : <SendHorizontal size={18} />}
        </button>
      </div>
    </form>
  );
}
