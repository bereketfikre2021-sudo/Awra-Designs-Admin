/**
 * Centralised SVG icon library — replaces all emoji usage in the admin.
 * All icons are 15×15 viewBox, 1.3 stroke width, rounded linecap/join.
 */

const base = 'w-[15px] h-[15px] flex-shrink-0'
const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const EditIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M10.5 2.5l2 2-7 7H3.5v-2l7-7z"/></svg>
export const TrashIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M2 4h11M5 4V2h5v2M6 7v5M9 7v5M3 4l1 9h7l1-9"/></svg>
export const CopyIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><rect x="5" y="5" width="7" height="8" rx="1"/><path d="M10 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2"/></svg>
export const ExternalLinkIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V9"/><path d="M9 2h4v4M13 2L8 7"/></svg>
export const PublishIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><circle cx="7.5" cy="7.5" r="5.5"/><path d="M5 7.5l2 2 3-3"/></svg>
export const UnpublishIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><circle cx="7.5" cy="7.5" r="5.5"/><path d="M5.5 5.5l4 4M9.5 5.5l-4 4"/></svg>
export const StarIcon = ({ filled = false }) => <svg className={base} viewBox="0 0 15 15" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 1.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L1.7 5.7l4-.6 1.8-3.6z"/></svg>
export const MenuIcon = () => <svg className={base} viewBox="0 0 15 15" fill="currentColor" stroke="none"><circle cx="7.5" cy="3.5" r="0.9"/><circle cx="7.5" cy="7.5" r="0.9"/><circle cx="7.5" cy="11.5" r="0.9"/></svg>
export const CloseIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M3 3l9 9M12 3l-9 9"/></svg>
export const SearchIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/></svg>
export const CheckIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M2.5 7.5l3.5 3.5 6.5-7"/></svg>
export const UndoIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M3 7a5 5 0 105 5"/><path d="M3 3v4h4"/></svg>
export const RedoIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M12 7a5 5 0 10-5 5"/><path d="M12 3v4H8"/></svg>
export const BoldIcon = () => <svg className={base} viewBox="0 0 15 15" fill="currentColor" stroke="none"><path d="M4 3h4.5a3 3 0 010 6H4V3zm0 6h5a3.5 3.5 0 010 7H4V9z" fillOpacity=".9"/></svg>
export const ItalicIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M6 3h5M4 12h5M9 3L6 12"/></svg>
export const UnderlineIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M4 3v5a3.5 3.5 0 007 0V3M2.5 13h10"/></svg>
export const StrikeIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M5 5s0-2.5 2.5-2.5S10 4 10 5c0 1-1 1.5-2.5 2H2.5M13 7.5H2"/><path d="M5.5 10c0 1 1 2.5 2.5 2.5S11 12 11 10"/></svg>
export const CodeIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M5 4L1 7.5 5 11M10 4l4 3.5L10 11"/></svg>
export const ListBulletIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><circle cx="2.5" cy="4.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="2.5" cy="7.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="2.5" cy="10.5" r="0.7" fill="currentColor" stroke="none"/><path d="M5 4.5h8M5 7.5h8M5 10.5h8"/></svg>
export const ListOrderedIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M5 4.5h8M5 7.5h8M5 10.5h8"/><text x="1" y="5.5" fontSize="4" fill="currentColor" stroke="none">1</text><text x="1" y="8.5" fontSize="4" fill="currentColor" stroke="none">2</text><text x="1" y="11.5" fontSize="4" fill="currentColor" stroke="none">3</text></svg>
export const QuoteIcon = () => <svg className={base} viewBox="0 0 15 15" fill="currentColor" stroke="none"><path d="M2 5a2 2 0 012-2h1a2 2 0 012 2v2a4 4 0 01-4 4V9a2 2 0 002-2H3a1 1 0 01-1-1V5zm7 0a2 2 0 012-2h1a2 2 0 012 2v2a4 4 0 01-4 4V9a2 2 0 002-2h-1a1 1 0 01-1-1V5z"/></svg>
export const AlignLeftIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M2 4h11M2 7h7M2 10h11M2 13h7"/></svg>
export const AlignCenterIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M2 4h11M4 7h7M2 10h11M4 13h7"/></svg>
export const AlignRightIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M2 4h11M6 7h7M2 10h11M6 13h7"/></svg>
export const LinkIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M5.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L6 4"/><path d="M9.5 5.5a3.5 3.5 0 00-5 0L2 8a3.5 3.5 0 005 5l1.5-1.5"/></svg>
export const ImageIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><rect x="1" y="2" width="13" height="11" rx="1"/><path d="M1 9l3-3 3 3 2-2 4 4"/><circle cx="5" cy="5.5" r="1" fill="currentColor" stroke="none"/></svg>
export const MinusIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M2 7.5h11"/></svg>
export const ClearIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M3 3l9 9M12 3l-9 9"/></svg>
export const UserIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><circle cx="7.5" cy="5" r="2.5"/><path d="M2 13a5.5 5.5 0 0111 0"/></svg>
export const ClockIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><circle cx="7.5" cy="7.5" r="5.5"/><path d="M7.5 4.5v3.5l2 2"/></svg>
export const ArrowReturnIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M3 7a5 5 0 105 5"/><path d="M3 3v4h4"/></svg>
export const GlobeIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><circle cx="7.5" cy="7.5" r="5.5"/><path d="M7.5 2c-2 2-3 3.5-3 5.5s1 3.5 3 5.5"/><path d="M7.5 2c2 2 3 3.5 3 5.5s-1 3.5-3 5.5"/><path d="M2 7.5h11"/></svg>
export const UploadIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M7.5 1v9M4 4l3.5-3L11 4"/><path d="M2 11v1a1 1 0 001 1h9a1 1 0 001-1v-1"/></svg>
export const ChevronDownIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M3 5l4.5 5L12 5"/></svg>
export const PlusIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M7.5 2v11M2 7.5h11"/></svg>
export const SendIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M13 2L1 7.5 6 8.5m7-6.5L8.5 14 6 8.5m0 0l4-3.5"/></svg>
export const ViewIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><path d="M1 7.5S3.5 3 7.5 3s6.5 4.5 6.5 4.5S13 12 7.5 12 1 7.5 1 7.5z"/><circle cx="7.5" cy="7.5" r="2"/></svg>
export const DatabaseIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><ellipse cx="7.5" cy="4" rx="5" ry="2"/><path d="M2.5 4v7c0 1.1 2.2 2 5 2s5-.9 5-2V4"/><path d="M2.5 7.5c0 1.1 2.2 2 5 2s5-.9 5-2"/></svg>
export const ServerIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><rect x="2" y="2" width="11" height="4" rx="1"/><rect x="2" y="9" width="11" height="4" rx="1"/><circle cx="4.5" cy="4" r="0.7" fill="currentColor" stroke="none"/><circle cx="4.5" cy="11" r="0.7" fill="currentColor" stroke="none"/></svg>
export const ActivityIcon = () => <svg className={base} viewBox="0 0 15 15" {...s}><polyline points="1,8 4,4 6,9 9,3 11,7 14,7"/></svg>

// ── Navigation icons (used by Layout sidebar) ─────────────────────────────────
export const DashboardIcon    = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="5" height="5" rx=".5"/><rect x="8.5" y="1.5" width="5" height="5" rx=".5"/><rect x="1.5" y="8.5" width="5" height="5" rx=".5"/><rect x="8.5" y="8.5" width="5" height="5" rx=".5"/></svg>
export const AnalyticsNavIcon = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,10 4,5 6,8 9,3 11,6 14,4"/><path d="M1 13h13"/></svg>
export const ProjectsIcon     = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="3.5" width="12" height="9" rx="1"/><path d="M5 3.5V2.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1M5 8h5M5 10.5h3"/></svg>
export const CategoriesIcon   = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 2.5h5v5h-5zM8.5 2.5h5v5h-5zM1.5 8.5h5v4h-5zM8.5 8.5h5v4h-5z"/></svg>
export const MediaIcon        = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2.5" width="12" height="10" rx="1"/><circle cx="5.5" cy="6" r="1.2"/><path d="M1.5 10.5l3-3.5 2.5 3 2-2.5 4 5"/></svg>
export const AboutIcon        = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="7.5" r="5.5"/><path d="M7.5 7v4M7.5 5v.5"/></svg>
export const TestimonialsIcon = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3.5a1 1 0 011-1h9a1 1 0 011 1v6a1 1 0 01-1 1H8.5L5.5 13v-2.5H3a1 1 0 01-1-1v-6z"/></svg>
export const FAQIcon          = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="7.5" r="5.5"/><path d="M5.5 6a2 2 0 113 1.7c-.5.3-.8.8-.8 1.3v.5M7.5 11.5v.5"/></svg>
export const BlogIcon         = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="11" height="11" rx="1"/><path d="M5 5.5h5M5 8h5M5 10.5h3"/></svg>
export const MessagesIcon     = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 2.5h12v8h-8L2 13V10.5H1.5v-8z"/></svg>
export const ActivityNavIcon  = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5,7.5 4,7.5 5.5,3.5 7.5,11.5 9.5,7.5 11,7.5 13.5,7.5"/></svg>
export const TeamIcon         = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="5" r="2.5"/><path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/><circle cx="11" cy="5" r="1.8"/><path d="M11 8.5c1.5.2 3 1.3 3 4"/></svg>
export const SettingsIcon     = () => <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="7.5" r="2"/><path d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h1M12.5 7.5h1M3.2 3.2l.7.7M11.1 11.1l.7.7M3.2 11.8l.7-.7M11.1 3.9l.7-.7"/></svg>
