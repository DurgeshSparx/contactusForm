import { json } from "@remix-run/node";
import { shopify } from "../shopify.server";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

export const loader = async () => {
  return json({ message: "Form submission endpoint working..." });
};
export const action = async ({ request }) => {
     try {
    console.log(Object.keys(prisma));
        const payload_body = await request.json();
   // console.log('data--->',payload_body);
   // Save into SQLite using Prisma
    const saved = await prisma.formSubmission.create({
      data: {
        title: payload_body.title,
        first_name: payload_body.first_name,
        last_name: payload_body.last_name,
        email: payload_body.email,
        country_code: payload_body.country_code,
        phone: payload_body.phone,
        store: payload_body.store,
      },
    });
    console.log("✅ Saved in DB:");

    return cors(request,  json({ success: true,  message: "Form submitted successfully"  })  );
  } catch (error) {
    console.error(error);
    return cors(request,  json({ success: false, error: "Failed to create bundle" }, { status: 500 }));
  }
}
