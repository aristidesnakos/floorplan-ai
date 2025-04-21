import { NextResponse } from 'next/server';
import prisma from '../../../../lib/db';
import { AnnotationData } from '../../../../types';

// GET /api/annotations/{pdfId}?pageNumber=1
export async function GET(
  request: Request,
  { params }: { params: { pdfId: string } }
) {
  const pdfId = decodeURIComponent(params.pdfId); // Decode filename if needed
  const { searchParams } = new URL(request.url);
  const pageNumberParam = searchParams.get('pageNumber');

  if (!pdfId || !pageNumberParam) {
    return NextResponse.json(
      { error: 'Missing pdfId or pageNumber parameter' },
      { status: 400 }
    );
  }

  const pageNumber = parseInt(pageNumberParam, 10);
  if (isNaN(pageNumber)) {
    return NextResponse.json(
      { error: 'Invalid pageNumber parameter' },
      { status: 400 }
    );
  }

  try {
    const annotations = await prisma.annotation.findMany({
      where: {
        pdfId: pdfId,
        pageNumber: pageNumber,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(annotations);
  } catch (error) {
    console.error('Failed to fetch annotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}

// POST /api/annotations/{pdfId}
export async function POST(
  request: Request,
  { params }: { params: { pdfId: string } }
) {
  const pdfId = decodeURIComponent(params.pdfId); // Decode filename if needed
  try {
    const body: Omit<AnnotationData, 'id' | 'createdAt' | 'pdfId'> = await request.json();

    // Basic Validation
    if (
      body.pageNumber == null ||
      body.x == null || body.y == null ||
      body.width == null || body.height == null
    ) {
      return NextResponse.json({ error: 'Missing required annotation fields' }, { status: 400 });
    }

    const newAnnotationData: AnnotationData = {
      ...body,
      pdfId: pdfId, // Add pdfId from the route parameter
    };

    const savedAnnotation = await prisma.annotation.create({
      data: newAnnotationData,
    });

    return NextResponse.json(savedAnnotation, { status: 201 });
  } catch (error) {
    console.error('Failed to save annotation:', error);
    // Handle potential JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to save annotation' },
      { status: 500 }
    );
  }
}
