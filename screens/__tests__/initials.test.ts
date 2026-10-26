import { initials } from '../profile/initials';

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Nimal Perera')).toBe('NP');
    expect(initials('Nimal Kumar Perera')).toBe('NK');
  });

  it('gives one letter for one word', () => {
    expect(initials('Nimal')).toBe('N');
  });

  it('upper-cases lower case input', () => {
    expect(initials('nimal perera')).toBe('NP');
  });

  it('ignores extra spaces between and around words', () => {
    expect(initials('  nimal    perera  ')).toBe('NP');
  });

  it('gives ? for blank, empty or missing names', () => {
    expect(initials('   ')).toBe('?');
    expect(initials('')).toBe('?');
    expect(initials(undefined)).toBe('?');
    expect(initials(null)).toBe('?');
  });
});
