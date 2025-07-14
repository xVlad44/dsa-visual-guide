import { Construction, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import RecursionVisualizer from '@/components/recursion/BacktrackingProblems';

export default function RecursionPage() {
  return (
    <RecursionVisualizer />
  );
}