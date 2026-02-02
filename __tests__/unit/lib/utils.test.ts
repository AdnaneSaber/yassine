import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (classname utility)', () => {
  it('fusionne les classes simples', () => {
    const result = cn('class1', 'class2');
    // clsx concatène, tailwind-merge ne fusionne que les classes Tailwind conflictuelles
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('gère les classes conditionnelles avec objets', () => {
    const result = cn('base-class', {
      'conditional-true': true,
      'conditional-false': false
    });
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-true');
    expect(result).not.toContain('conditional-false');
  });

  it('gère les tableaux de classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('filtre les valeurs falsy', () => {
    const result = cn('class1', null, undefined, false, 'class2', '');
    expect(result).toContain('class2');
    expect(result).not.toContain('null');
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('false');
  });

  it('fusionne correctement les classes Tailwind', () => {
    const result = cn('px-2 py-1', 'px-4');
    // tailwind-merge garde px-4 et py-1
    expect(result).toContain('px-4');
    expect(result).toContain('py-1');
    expect(result).not.toContain('px-2');
  });

  it('fusionne les classes de couleur Tailwind', () => {
    const result = cn('text-red-500', 'text-blue-600');
    expect(result).toBe('text-blue-600');
  });

  it('gère les classes responsives', () => {
    const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
    expect(result).toContain('text-sm');
    expect(result).toContain('md:text-base');
    expect(result).toContain('lg:text-lg');
  });

  it('retourne une chaîne vide quand aucune classe n\'est fournie', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('gère les espaces excessifs', () => {
    const result = cn('  class1  ', '  class2  ');
    expect(result).toContain('class2');
  });

  it('gère correctement les pseudo-classes Tailwind', () => {
    const result = cn('hover:bg-blue-500', 'hover:bg-red-500');
    expect(result).toBe('hover:bg-red-500');
  });

  it('fusionne les classes de taille', () => {
    const result = cn('w-full', 'w-1/2', 'h-10', 'h-20');
    expect(result).toContain('w-1/2');
    expect(result).toContain('h-20');
    expect(result).not.toContain('w-full');
    expect(result).not.toContain('h-10');
  });

  it('gère les variantes de boutons', () => {
    const baseClasses = 'inline-flex items-center justify-center';
    const variantClasses = 'bg-blue-500 text-white hover:bg-blue-600';
    const sizeClasses = 'px-4 py-2 text-sm';
    
    const result = cn(baseClasses, variantClasses, sizeClasses);
    
    expect(result).toContain('inline-flex');
    expect(result).toContain('items-center');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('px-4');
  });

  it('permet d\'override des classes par la suite', () => {
    const defaultClasses = 'rounded-md border border-gray-300';
    const overrideClasses = 'rounded-lg border-blue-500';
    
    const result = cn(defaultClasses, overrideClasses);
    
    expect(result).toContain('rounded-lg');
    expect(result).toContain('border-blue-500');
    expect(result).not.toContain('rounded-md');
    expect(result).not.toContain('border-gray-300');
  });

  it('gère les arguments variadiques', () => {
    const result = cn(
      'class1',
      'class2',
      undefined,
      ['class3', 'class4'],
      { 'class5': true, 'class6': false },
      'class7'
    );
    
    expect(result).toContain('class7');
    expect(result).toContain('class5');
    expect(result).toContain('class4');
  });
});
