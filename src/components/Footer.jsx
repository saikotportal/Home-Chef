import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINKS = {
  customer: {
    quickLinks: [
      { label: 'Browse Meals',  path: '/listings' },
      { label: 'Browse Chefs',  path: '/chefs' },
      { label: 'Become a Chef', path: '/become-a-chef' },
      { label: 'My Orders',     path: '/orders' },
      { label: 'Notifications', path: '/notifications' },
    ],
    account: [
      { label: 'Profile',       path: '/profile' },
      { label: 'Cart',          path: '/cart' },
      { label: 'Order History', path: '/orders' },
      { label: 'My Reviews',    path: '/reviews' },
      { label: 'About',         path: '/about' },
    ],
  },
  chef: {
    quickLinks: [
      { label: 'Chef Dashboard', path: '/chef-dashboard' },
      { label: 'Browse Meals',   path: '/listings' },
      { label: 'Browse Chefs',   path: '/chefs' },
      { label: 'My Reviews',     path: '/reviews' },
      { label: 'Notifications',  path: '/notifications' },
    ],
    account: [
      { label: 'Chef Profile',  path: '/profile' },
      { label: 'Become a Chef', path: '/become-a-chef' },
      { label: 'Order Tracker', path: '/orders' },
      { label: 'About',         path: '/about' },
      { label: 'Home',          path: '/' },
    ],
  },
  rider: {
    quickLinks: [
      { label: 'Rider Dashboard',   path: '/rider-dashboard' },
      { label: 'Active Deliveries', path: '/rider-dashboard' },
      { label: 'Browse Meals',      path: '/listings' },
      { label: 'Notifications',     path: '/notifications' },
      { label: 'About',             path: '/about' },
    ],
    account: [
      { label: 'Profile',     path: '/profile' },
      { label: 'Home',        path: '/' },
      { label: 'Browse Chefs',path: '/chefs' },
      { label: 'My Reviews',  path: '/reviews' },
      { label: 'Search',      path: '/search' },
    ],
  },
  guest: {
    quickLinks: [
      { label: 'Browse Meals',  path: '/listings' },
      { label: 'Browse Chefs',  path: '/chefs' },
      { label: 'Become a Chef', path: '/become-a-chef' },
      { label: 'About',         path: '/about' },
      { label: 'Sign In',       path: '/login' },
    ],
  },
}

function FooterLinks({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.slice(0, 5).map((l) => (
          <li key={l.path + l.label}>
            <Link to={l.path} className="text-gray-400 hover:text-brand text-sm transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? null

  const isGuest = !role
  const roleLinks = LINKS[role] ?? null

  const roleTag = {
    customer: { label: '🛒 Customer', colour: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    chef:     { label: '🍳 Chef',     colour: 'text-green-400 bg-green-400/10 border-green-400/20' },
    rider:    { label: '🛵 Rider',    colour: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  }[role]

  return (
    <footer className="bg-dark text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* COL 1 — Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-3">
              <span className="text-2xl">🍳</span>
              <span>Home<span className="text-brand">Chef</span></span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Connecting passionate home cooks with food lovers in your community.
              Real food, real people.
            </p>
            {roleTag && (
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${roleTag.colour}`}>
                {roleTag.label}
              </span>
            )}
            {isGuest && (
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border text-brand bg-brand/10 border-brand/20 hover:bg-brand/20 transition-colors"
              >
                👤 Sign in
              </Link>
            )}
          </div>

          {/* COL 2 — Quick Links */}
          <div>
            {roleLinks && (
              <FooterLinks
                title="Quick Links"
                links={isGuest ? LINKS.guest.quickLinks : roleLinks.quickLinks}
              />
            )}
          </div>

          {/* COL 3 — Account (logged in) or Demo Credentials (guest) */}
          <div>
            {!isGuest && roleLinks && (
              <FooterLinks title="Account" links={roleLinks.account} />
            )}

            {isGuest && (
              <>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3">
                  Demo Credentials
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-green-400">Chef</span>
                    <span className="text-gray-400 ml-2">rashida@chef.com / chef123</span>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-blue-400">Customer</span>
                    <span className="text-gray-400 ml-2">rifat@customer.com / customer123</span>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-blue-300">Customer</span>
                    <span className="text-gray-400 ml-2">badhon@customer.com / customer123</span>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-purple-400">Rider</span>
                    <span className="text-gray-400 ml-2">rakib@rider.com / rider123</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 text-xs">
            © 2026 HomeChef Marketplace · Prototype build for{' '}
            <Link to="/about" className="text-brand hover:underline">saikot.dev</Link>
          </p>
          <a
            href="https://saikot.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 text-xs hover:text-brand transition-colors font-mono tracking-wide"
          >
            saikot.dev ↗
          </a>
        </div>

      </div>
    </footer>
  )
}
