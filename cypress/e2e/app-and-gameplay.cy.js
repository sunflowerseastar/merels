/// <reference types="Cypress" />
describe('Two users (at same computer) play a game', () => {
  before(() => {
    cy.visit('/');
  });

  it('places all pieces and checks for invalid places/lifts', () => {
    // set up white to form a mill
    // w        w        -
    //    b     b     -
    //       -  -  -
    // -     -     -     -
    //       -  -  -
    //    -     -     -
    // -        -        -
    // cy.get('.point').eq(0).click().find('span').should('have.class', 'w');

    cy.get('.point').eq(0).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    cy.get('.point').eq(3).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    cy.get('.point').eq(1).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    cy.get('.point').eq(4).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    // place white in top right and take topmost-leftmost black
    // w        w        w
    //    -     b     -
    //       -  -  -
    // -     -     -     -
    //       -  -  -
    //    -     -     -
    // -        -        -
    cy.get('.point').eq(2).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    cy.get('.point').eq(3).as('point').click();
    cy.get('@point')
      .find('span')
      .should('not.have.class', 'w')
      .should('not.have.class', 'b')
      .should('have.class', 'empty');

    // black tries to place where it's occupied by black, so it's still black's turn
    cy.get('.point').eq(4).as('point').click();
    cy.get('@point').get('.controls').find('.current-b').should('exist');

    // black tries to place where it's occupied by white, so it's still black's turn
    cy.get('.point').eq(0).as('point').click();
    cy.get('@point').get('.controls').find('.current-b').should('exist');

    // pieces are placed
    cy.get('.point').eq(3).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    cy.get('.point').eq(9).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    cy.get('.point').eq(6).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    cy.get('.point').eq(8).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    cy.get('.point').eq(10).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    cy.get('.point').eq(14).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    cy.get('.point').eq(16).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    cy.get('.point').eq(17).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    cy.get('.point').eq(20).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    cy.get('.point').eq(18).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    cy.get('.point').eq(21).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    // white forms a mill
    cy.get('.point').eq(12).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    // white removes black
    cy.get('.point').eq(4).as('point').click();
    cy.get('@point').find('span').should('have.class', 'empty');

    // black places its final piece (no mill formed)
    cy.get('.point').eq(11).as('point').click();
    cy.get('@point').find('span').should('have.class', 'b');

    // END PLACING PHASE / BEGIN MOVING PHASE
    // board at this state
    // w     w     w
    //   b   -   -
    //     b - w
    // w b b   w - w
    //     - b w
    //   w   -   b
    // b     -     -

    // white tries to lift black, so it's still white's turn
    cy.get('.point').eq(3).as('point').click();
    cy.get('@point')
      .find('span')
      .should('have.class', 'b')
      .get('.controls')
      .find('.current-w');

    // white tries to lift empty, so it's still white's turn
    cy.get('.point').eq(4).as('point').click();
    cy.get('@point')
      .find('span')
      .should('have.class', 'empty')
      .get('.controls')
      .find('.current-w');

    // white tries to lift a piece that has no adjacent moves possible, so it's still white's turn
    cy.get('.point').eq(0).as('point').click();
    cy.get('@point')
      .find('span')
      .should('have.class', 'w')
      .get('.controls')
      .find('.current-w');
    // .get('.feedback').children().should('contain', 'immovable');

    // white successfully lifts white...
    cy.get('.point').eq(1).click();

    // ...and places it
    cy.get('.point').eq(4).as('point').click();
    cy.get('@point').find('span').should('have.class', 'w');

    // black successfully lifts...
    cy.get('.point').eq(16).click();

    // ...moves and forms mill...
    cy.get('.point').eq(15).click();

    // // ...and fails to try to lift a black...
    cy.get('.point').eq(3).as('point').click();
    cy.get('@point')
      .get('.controls')
      .find('.current-b')
      .get('.feedback')
      .children()
      .should('contain', 'invalid');

    // // ...and fails to try to lift a white locked in a mill...
    cy.get('.point').eq(8).as('point').click();
    cy.get('@point')
      .get('.controls')
      .find('.current-b')
      .get('.feedback')
      .children()
      .should('contain', 'locked in mill');

    // // ...and fails to try to lift an empty...
    cy.get('.point').eq(1).as('point').click();
    cy.get('@point').get('.feedback').children().should('contain', 'invalid');

    // // ...and finally succeeds in lifting a white
    cy.get('.point').eq(9).as('point').click();
    cy.get('@point').get('.controls').find('.current-w');

    // board at this state
    // w     -     w
    //   b   w   -
    //     b - w
    // - b b   w - w
    //     b - w
    //   w   -   b
    // b     -     -

    // white forms a mill and takes a black
    cy.get('.point').eq(4).click();
    cy.get('.point').eq(1).click();
    cy.get('.point').eq(10).click().get('.controls').find('.current-b');

    // black moves, no mill
    cy.get('.point').eq(11).click();
    cy.get('.point').eq(10).click().get('.controls').find('.current-w');

    // white moves, no mill
    cy.get('.point').eq(1).click();
    cy.get('.point').eq(4).click().get('.controls').find('.current-b');

    // black forms a mill and takes a white
    cy.get('.point').eq(10).click();
    cy.get('.point').eq(11).click();
    cy.get('.point').eq(14).click().get('.controls').find('.current-w');

    // white forms a mill and takes a black
    cy.get('.point').eq(4).click();
    cy.get('.point').eq(1).click();
    cy.get('.point').eq(20).click().get('.controls').find('.current-b');

    // black moves, no mill
    cy.get('.point').eq(11).click();
    cy.get('.point').eq(10).click().get('.controls').find('.current-w');

    // white moves, no mill
    cy.get('.point').eq(1).click();
    cy.get('.point').eq(4).click().get('.controls').find('.current-b');

    // black forms a mill and takes a white
    cy.get('.point').eq(10).click();
    cy.get('.point').eq(11).click();
    cy.get('.point').eq(18).click().get('.controls').find('.current-w');

    // white moves, no mill
    cy.get('.point').eq(12).click();
    cy.get('.point').eq(13).click();

    // black moves, no mill
    cy.get('.point').eq(11).click();
    cy.get('.point').eq(10).click().get('.controls').find('.current-w');

    // white forms a mill and takes a black
    cy.get('.point').eq(4).click();
    cy.get('.point').eq(1).click();
    cy.get('.point').eq(3).click().get('.controls').find('.current-b');

    // black moves, no mill
    cy.get('.point').eq(21).click();
    cy.get('.point').eq(22).click().get('.controls').find('.current-w');

    // white forms a mill and takes a black
    cy.get('.point').eq(13).click();
    cy.get('.point').eq(12).click();
    cy.get('.point')
      .eq(10)
      .click()
      .get('.controls')
      .find('.current-b')
      .get('.feedback')
      .children()
      .should('contain', 'flying');

    // BLACK IS FLYING

    // board at this state
    // w     w     w
    //   -   -   -
    //     b - w
    // - - -   w - -
    //     b - w
    //   -   -   -
    // -     b     -

    // black flies, forms a mill, and takes a white locked in a mill (which is
    // permitted since no other white pieces are available)
    cy.get('.point').eq(22).click();
    cy.get('.point').eq(11).click();
    cy.get('.point').eq(12).click().get('.controls').find('.current-w');

    // white fails to move (only black is flying)
    cy.get('.point').eq(1).click();
    cy.get('.point')
      .eq(5)
      .click()
      .get('.controls')
      .find('.current-w')
      .get('.feedback')
      .children()
      .should('contain', 'illegal');

    // white successfully moves, no mill
    cy.get('.point').eq(1).click();
    cy.get('.point').eq(4).click().get('.controls').find('.current-b');

    // black flies
    cy.get('.point').eq(6).click();
    cy.get('.point').eq(1).click().get('.controls').find('.current-w');

    // white moves, no mill
    cy.get('.point').eq(8).click();
    cy.get('.point').eq(12).click().get('.controls').find('.current-b');

    // black flies, forms mill, removes white
    cy.get('.point').eq(1).click();
    cy.get('.point').eq(6).click();
    cy.get('.point').eq(4).click().get('.controls').find('.current-w');

    // white moves, no mill
    cy.get('.point').eq(12).click();
    cy.get('.point').eq(8).click().get('.controls').find('.current-b');

    // black moves, no mill
    cy.get('.point').eq(6).click();
    cy.get('.point').eq(7).click().get('.controls').find('.current-w');

    // white moves, no mill
    cy.get('.point').eq(8).click();
    cy.get('.point').eq(12).click().get('.controls').find('.current-b');

    // black moves, forms mill, takes white, now white is flying
    cy.get('.point').eq(7).click();
    cy.get('.point').eq(6).click();
    cy.get('.point')
      .eq(12)
      .click()
      .get('.controls')
      .find('.current-w')
      .get('.feedback')
      .children()
      .should('contain', 'flying');

    // white moves, forms mill, takes black, wins
    // cy.get('.point').eq(17).click();
    // cy.get('.point').eq(1).click();
    // cy.get('.point').eq(11).click().get('.controls');
    // .should('contain', 'restart')
    // .get('.feedback')
    // .children()
    // .should('contain', 'white wins');
    // TODO remove the last one
    // TODO add feedback 'white wins'

    // restart
    // TODO add restart
    // cy.get('.controls').find('.reset').click();
    // cy.get('.controls').find('.current-w');
    // cy.get('.controls').find('.action').children().should('contain', 'place');
  });
});
