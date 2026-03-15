import {
	ArrowUpRight,
	BadgeCheck,
	ExternalLink,
	Instagram,
	Mail,
	MessageCircle,
	Users,
} from "lucide-react";

const OFFICIAL_EMAIL = "console.business.team@gmail.com";
const FEEDBACK_FORM_URL = "https://forms.gle/3soGUDsiBBN1ygvX9";
const INSTAGRAM_URL = "https://www.instagram.com/console_x_academia";
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/B4lNYZtRrAj6lqqRMIGvF5";

export default function ContactUsPage() {
	return (
		<div className="min-h-screen text-white px-4 py-10 sm:px-6 lg:px-10">
			<div className="mx-auto w-full max-w-6xl">
				<div className="mb-8 sm:mb-10">
					<p className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-orange-300">
						<BadgeCheck size={14} />
						Contact Console X Academia
					</p>
					<h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
						Let&apos;s Build Better Campus Tools Together
					</h1>
					<p className="mt-4 max-w-3xl text-sm text-white/70 sm:text-base">
						Reach out for support, feedback, Social club onboarding, collaborations,
						and updates from the Academia team.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					<section className="glass-card rounded-2xl p-6 sm:p-7">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-orange-500/15 p-2.5 text-orange-300">
								<Mail size={18} />
							</div>
							<h2 className="text-lg font-bold sm:text-xl">Official Email</h2>
						</div>
						<p className="mt-4 text-sm text-white/70">
							For general support and official communication, mail us here.
						</p>
						<a
							href={`mailto:${OFFICIAL_EMAIL}`}
							className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-orange-300 transition hover:border-orange-400/50 hover:bg-orange-500/10"
						>
							{OFFICIAL_EMAIL}
							<ArrowUpRight size={16} />
						</a>
						<p className="mt-3 text-xs text-white/50">
							Personal contact can also be handled through this same email.
						</p>
					</section>

					<section className="glass-card rounded-2xl p-6 sm:p-7">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-orange-500/15 p-2.5 text-orange-300">
								<MessageCircle size={18} />
							</div>
							<h2 className="text-lg font-bold sm:text-xl">Feedback Section</h2>
						</div>
						<p className="mt-4 text-sm text-white/70">
							Share improvements, report issues, or suggest new features through
							our Google Form.
						</p>
						<a
							href={FEEDBACK_FORM_URL}
							target="_blank"
							rel="noreferrer"
							className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400"
						>
							Open Feedback Google Form
							<ExternalLink size={16} />
						</a>
					</section>

					<section className="glass-card rounded-2xl p-6 sm:p-7">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-orange-500/15 p-2.5 text-orange-300">
								<Users size={18} />
							</div>
							<h2 className="text-lg font-bold sm:text-xl">Create Club on Social</h2>
						</div>
						<p className="mt-4 text-sm text-white/70">
							Want your student club/community listed on Social? Send your details
							to our official mail and we will help onboard your club.
						</p>
						<a
							href={`mailto:${OFFICIAL_EMAIL}?subject=Club%20Creation%20Request%20-%20Academia%20Social`}
							className="mt-5 inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-200 transition hover:border-orange-400 hover:bg-orange-500/20"
						>
							Mail for Club Creation
							<ArrowUpRight size={16} />
						</a>
					</section>

					<section className="glass-card rounded-2xl p-6 sm:p-7">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-orange-500/15 p-2.5 text-orange-300">
								<MessageCircle size={18} />
							</div>
							<h2 className="text-lg font-bold sm:text-xl">WhatsApp Community</h2>
						</div>
						<p className="mt-4 text-sm text-white/70">
							Join the WhatsApp group for announcements, updates, and direct
							community discussions.
						</p>
						<a
							href={WHATSAPP_GROUP_URL}
							target="_blank"
							rel="noreferrer"
							className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
						>
							Join WhatsApp Group
							<ExternalLink size={16} />
						</a>
					</section>
				</div>

				<section className="glass-card mt-5 rounded-2xl p-6 sm:p-7">
					<h2 className="text-lg font-bold sm:text-xl">Follow Us</h2>
					<p className="mt-3 max-w-3xl text-sm text-white/70">
						Built and maintained by the Console X Academia team to make student
						academic workflows faster, cleaner, and smarter.
					</p>
					<a
						href={INSTAGRAM_URL}
						target="_blank"
						rel="noreferrer"
						className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-pink-300 transition hover:border-pink-400/40 hover:bg-pink-500/10"
					>
						<Instagram size={16} />
						Follow on Instagram
						<ExternalLink size={15} />
					</a>
				</section>
			</div>
		</div>
	);
}
