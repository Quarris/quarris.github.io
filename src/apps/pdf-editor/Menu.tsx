import { Check, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface MenuItem {
	label: string;
	disabled?: boolean;
	checked?: boolean;
	onSelect?(): void;
	items?: MenuEntry[];
}

type MenuEntry = MenuItem | 'separator';

interface Props {
	label: string;
	items: MenuEntry[];
	align?: 'left' | 'right';
	disabled?: boolean;
}

export function Menu({ label, items, align = 'left', disabled }: Props) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onPointer = (e: PointerEvent) => !ref.current!.contains(e.target as Node) && setOpen(false);
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	return (
		<div className="menu" ref={ref}>
			<button
				className="menu-button"
				aria-haspopup="menu"
				aria-expanded={open}
				disabled={disabled}
				onClick={() => setOpen(!open)}
			>
				{label}
			</button>
			{open && <MenuList items={items} className={align} close={() => setOpen(false)} />}
		</div>
	);
}

function MenuList({ items, className, close }: { items: MenuEntry[]; className: string; close(): void }) {
	const [submenu, setSubmenu] = useState<number | null>(null);
	return (
		<div className={`menu-list ${className}`} role="menu">
			{items.map((item, i) =>
				item === 'separator' ? (
					<hr key={i} />
				) : (
					<div key={item.label} className="menu-item" onMouseEnter={() => setSubmenu(item.items ? i : null)}>
						<button
							role="menuitem"
							disabled={item.disabled}
							aria-haspopup={item.items ? 'menu' : undefined}
							aria-expanded={item.items ? submenu === i : undefined}
							onClick={() => {
								if (item.items) return setSubmenu(submenu === i ? null : i);
								close();
								item.onSelect?.();
							}}
						>
							{item.label}
							{item.checked && <Check size={14} />}
							{item.items && <ChevronRight size={14} />}
						</button>
						{item.items && submenu === i && !item.disabled && <MenuList items={item.items} className="submenu" close={close} />}
					</div>
				),
			)}
		</div>
	);
}
