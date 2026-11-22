import { useEffect, useRef, useState } from 'react';

interface Props {
	title: string;
	suffix: string;
	note?: string;
	action: string;
	initialName: string;
	onConfirm(name: string): void;
	onClose(): void;
}

export function NameDialog({ title, suffix, note, action, initialName, onConfirm, onClose }: Props) {
	const ref = useRef<HTMLDialogElement>(null);
	const [name, setName] = useState(initialName);
	const clean = name.trim().replace(/[\\/:*?"<>|]/g, '-');

	useEffect(() => ref.current!.showModal(), []);

	return (
		<dialog ref={ref} className="dialog" onClose={onClose}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (clean) onConfirm(clean);
				}}
			>
				<h2>{title}</h2>
				<label className="name-field">
					<input
						autoFocus
						aria-label="File name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onFocus={(e) => e.target.select()}
					/>
					<span>{suffix}</span>
				</label>
				{note && <p className="hint">{note}</p>}
				<div className="actions">
					<button type="button" className="button" onClick={() => ref.current!.close()}>
						Cancel
					</button>
					<button type="submit" className="button primary" disabled={!clean}>
						{action}
					</button>
				</div>
			</form>
		</dialog>
	);
}
