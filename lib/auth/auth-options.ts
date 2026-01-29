import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Utilisateur, Etudiant } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';
import type { UserRole } from '@/types/database';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        await connectDB();

        // Try to find user in Utilisateurs (admins)
        const user = await Utilisateur.findOne({ email: credentials.email, actif: true });

        if (user) {
          const isValid = await user.comparePassword(credentials.password);
          if (!isValid) {
            throw new Error('Email ou mot de passe incorrect');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: user.role as string,
            type: 'admin'
          };
        }

        // Try to find in Etudiants (students) - for now, no password check
        const etudiant = await Etudiant.findOne({ email: credentials.email, actif: true });

        if (etudiant) {
          // For students, accept any password for now (or implement student password field)
          return {
            id: etudiant._id.toString(),
            email: etudiant.email,
            name: `${etudiant.prenom} ${etudiant.nom}`,
            role: 'STUDENT' as string,
            type: 'student',
            matricule: etudiant.matricule
          };
        }

        throw new Error('Utilisateur non trouvé');
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.type = user.type;
        token.matricule = (user as any).matricule;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).type = token.type;
        (session.user as any).matricule = token.matricule;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
};
