export function MarcaDoAloca({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" viewBox="0 0 28 28" className={className}>
			<rect x="2" y="5" width="24" height="21" rx="5" className="fill-tinta" />
			<rect x="8" y="2" width="2.5" height="6" rx="1.25" className="fill-tinta" />
			<rect x="17.5" y="2" width="2.5" height="6" rx="1.25" className="fill-tinta" />
			<circle cx="18.5" cy="17.5" r="4" className="fill-azul" />
		</svg>
	);
}
