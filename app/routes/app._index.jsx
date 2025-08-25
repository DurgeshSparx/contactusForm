import { useEffect } from "react";
import { useFetcher,useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  DataTable 
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const submissions = await prisma.formSubmission.findMany({
    orderBy: { createdAt: "asc" },
 });
 // Merge columns
  const rows = submissions.map((s) => [
    s.id,
    `${s.title} ${s.first_name} ${s.last_name}`, // Name column
    s.email,
    s.phone ? `${s.country_code} ${s.phone}` : "-", // Phone column
    s.store ?? "-",
    new Date(s.createdAt).toLocaleString(),
  ]);

  return json({ rows });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
const { rows } = useLoaderData();
  return (
    <Page>
      <TitleBar title="Form Data">     
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
             <DataTable
        columnContentTypes={[
          "numeric", // ID
          "text",    // Name
          "text",    // Email
          "text",    // Phone
          "text",    // Store
          "text",    // Created At
        ]}
        headings={[
          "ID",
          "Name",
          "Email",
          "Phone",
          "Store",
          "Created At",
        ]}
        rows={rows}
      />
            </Card>
          </Layout.Section>
        
        </Layout>
      </BlockStack>
    </Page>
  );
}
