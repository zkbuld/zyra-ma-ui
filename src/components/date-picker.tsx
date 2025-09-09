import { ChevronDownIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import React from "react"
import { now } from "es-toolkit/compat"
import type { DateRange, Matcher } from "react-day-picker"

const due = 3 * 365 * 24 * 60 * 60 * 1000;
const hidden: Matcher[] = [{ before: new Date(now() - due) }, { after: new Date(now() + due) }]
export function DatePicker({ onChange, date }: { onChange?: (date: Date | undefined) => void, date?: Date }) {
    const [open, setOpen] = React.useState(false)

    return <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
                variant="outline"
                id="date"
                className="w-48 justify-between font-normal"
            >
                {date ? date.toLocaleDateString() : "Select date"}
                <ChevronDownIcon />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
                hidden={hidden}
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={(date) => {
                    setOpen(false)
                    onChange?.(date)
                }}
            />
        </PopoverContent>
    </Popover>
}
export function DateRangePicker({ onChange, date }: { onChange?: (date: DateRange | undefined) => void, date?: DateRange }) {
    const [open, setOpen] = React.useState(false)
    return <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
                variant="outline"
                id="date"
                className="w-xl justify-between font-normal"
            >
                {date && date.from && date.to ? `${date.from.toLocaleDateString()} 00:00:00 -> ${date.to.toLocaleDateString()} 23:59:59` : "Select date range"}
                <ChevronDownIcon />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
                hidden={hidden}
                mode="range"
                selected={date}
                captionLayout="dropdown"
                onSelect={(date) => {
                    setOpen(false)
                    onChange?.(date)
                }}
            />
        </PopoverContent>
    </Popover>
}