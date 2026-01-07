"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  items: { id: number | string; name: string }[];
  placeholder: string;
  onSelect: (id: number | string) => void;
  noSelect?: boolean;
  className?: string;
}

export function Combobox({ items, placeholder, onSelect, noSelect, className }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [popoverWidth, setPopoverWidth] = useState(0);

  const handleOpenChange = (newOpen: boolean) => {
    // Se noSelect é true, permitir que o usuário controle manualmente
    // Caso contrário, seguir comportamento normal
    setOpen(newOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          ref={(element) => {
            if (element) {
              setPopoverWidth(element.offsetWidth);
            }
          }}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start"
        style={{ width: popoverWidth }}
      >
        <Command shouldFilter={true}>
          <CommandInput 
            placeholder={`Buscar ${placeholder.toLowerCase()}...`} 
            onKeyDown={(e) => {
              // Se noSelect é true e pressionar Enter, não fecha o popover
              if (noSelect && e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    // Sempre chama o callback para adicionar o item
                    if (typeof item.id === "string") {
                      onSelect(item.id);
                    } else {
                      onSelect(item.id);
                    }
                    // Se noSelect é true, não fecha o popover e não atualiza o valor
                    // Isso permite selecionar múltiplos itens
                    if (noSelect) {
                      // Não fecha o popover, permite selecionar mais
                      // O popover permanece aberto para seleção múltipla
                      return;
                    }
                    // Para seleção única, fecha o popover e atualiza o valor
                    setOpen(false);
                    setValue(item.name);
                  }}
                >
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
