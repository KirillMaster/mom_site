import Button from '@/components/ui/Button';

const SimilarOrderLink = ({ title }: { title: string }) => (
  <Button
    href={`/order?artwork=${encodeURIComponent(title)}`}
    variant="secondary"
    data-testid="similar-order-link"
    className="mt-3 w-full sm:w-auto"
  >
    Хочу похожую
  </Button>
);

export default SimilarOrderLink;
