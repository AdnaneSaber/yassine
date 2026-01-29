import { NextRequest, NextResponse } from 'next/server';
import { queryDemandesSchema, createDemandeSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { Demande, Etudiant } from '@/lib/db/models';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import { STATUTS_META } from '@/lib/workflow/constants';
import connectDB from '@/lib/db/mongodb';

// GET /api/demandes - List demandes with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = queryDemandesSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      statut: searchParams.get('statut'),
      priorite: searchParams.get('priorite'),
      typeDemande: searchParams.get('typeDemande'),
      sortBy: searchParams.get('sortBy'),
      search: searchParams.get('search')
    });

    // Build MongoDB query
    const filter: any = {};

    if (query.statut) {
      filter['statut.code'] = query.statut;
    }

    if (query.priorite) {
      filter.priorite = query.priorite;
    }

    if (query.typeDemande) {
      filter['typeDemande.code'] = query.typeDemande;
    }

    if (query.search) {
      filter.$or = [
        { numeroDemande: new RegExp(query.search, 'i') },
        { objet: new RegExp(query.search, 'i') },
        { 'etudiant.nom': new RegExp(query.search, 'i') },
        { 'etudiant.prenom': new RegExp(query.search, 'i') }
      ];
    }

    // Parse sort
    const sortField = query.sortBy.startsWith('-') ? query.sortBy.slice(1) : query.sortBy;
    const sortOrder = query.sortBy.startsWith('-') ? -1 : 1;

    // Execute query with pagination
    const [items, total] = await Promise.all([
      Demande.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Demande.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/demandes - Create new demande
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = createDemandeSchema.parse(body);

    // Get current user (from session/auth)
    // This is a placeholder - implement based on your auth solution
    const currentUser = { id: 'user-id', role: 'STUDENT' };

    // Fetch etudiant data
    const etudiant = await Etudiant.findById(currentUser.id);
    if (!etudiant) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RES_001', message: 'Étudiant non trouvé' }
        },
        { status: 404 }
      );
    }

    // Create demande with SOUMIS status
    const demande = await Demande.create({
      etudiant: {
        id: etudiant._id,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        email: etudiant.email,
        matricule: etudiant.matricule
      },
      typeDemande: {
        code: validated.typeDemande,
        nom: getTypeDemandeNom(validated.typeDemande),
        delaiTraitement: getDelaiTraitement(validated.typeDemande)
      },
      statut: {
        code: 'SOUMIS',
        ...STATUTS_META.SOUMIS
      },
      objet: validated.objet,
      description: validated.description,
      priorite: validated.priorite,
      documents: [], // Documents added separately
      metadata: {}
    });

    // Auto-transition to RECU
    const workflow = new DemandeWorkflow(demande, {
      userId: 'SYSTEM',
      userRole: 'SYSTEM' as any
    });
    await workflow.transition('RECU');

    return NextResponse.json(
      { success: true, data: demande },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper functions
function getTypeDemandeNom(code: string): string {
  const names: Record<string, string> = {
    ATTESTATION_SCOLARITE: 'Attestation de scolarité',
    RELEVE_NOTES: 'Relevé de notes',
    ATTESTATION_REUSSITE: 'Attestation de réussite',
    DUPLICATA_CARTE: 'Duplicata de carte étudiant',
    CONVENTION_STAGE: 'Convention de stage'
  };
  return names[code] || code;
}

function getDelaiTraitement(code: string): number {
  const delais: Record<string, number> = {
    ATTESTATION_SCOLARITE: 3,
    RELEVE_NOTES: 5,
    ATTESTATION_REUSSITE: 7,
    DUPLICATA_CARTE: 10,
    CONVENTION_STAGE: 5
  };
  return delais[code] || 5;
}
