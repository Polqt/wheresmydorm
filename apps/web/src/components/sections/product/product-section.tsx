import { FeaturesBento } from "./features";
import { HowItWorksStack } from "./how-it-works";

export function Product() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="scroll-mt-24 border-b border-marketing-border bg-marketing-card"
    >
      <FeaturesBento />
      <HowItWorksStack />
    </section>
  );
}
