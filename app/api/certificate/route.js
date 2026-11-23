import { NextResponse } from "next/server";
import { getCurrentUser } from "../../lib/current-user";
import { getLearning } from "../../lib/learning.mjs";
import { courses } from "../../lib/course-content.mjs";
import { hasPassedCourse } from "../../lib/learning-utils.mjs";
import { issueCertificate, renderCertificatePdf } from "../../lib/certificate.mjs";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in to download your certificate." }, { status: 401 });
    const courseId = new URL(request.url).searchParams.get("courseId") || courses[0]?.id;
    const course = courses.find(item => item.id === courseId);
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
    const learning = await getLearning(user.id);
    const answers = learning.answers?.[course.id] || (course === courses[0] ? learning.answers : {});
    if (!hasPassedCourse(answers, course)) return NextResponse.json({ error: "Pass every section quiz to unlock this certificate." }, { status: 403 });
    const certificate = await issueCertificate(user.id, course.id);
    const pdf = renderCertificatePdf({ learnerName: user.name || "CyberQ Learner", courseTitle: course.title, issuedAt: certificate.issuedAt, certificateId: certificate.id });
    const filename = `${course.id}-certificate-${certificate.id}.pdf`;
    return new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Content-Length": String(pdf.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Your certificate is temporarily unavailable." }, { status: 503 });
  }
}
