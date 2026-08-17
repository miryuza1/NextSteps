import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tracker/:path*',
    '/resume-tailor/:path*',
    '/cover-letter/:path*',
    '/interview-prep/:path*',
    '/api/applications/:path*',
    '/api/resume-tailor/:path*',
    '/api/cover-letter/:path*',
    '/api/interview-prep/:path*',
  ],
};
