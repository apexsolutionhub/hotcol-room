import { graphqlRequest } from "./client";
import { readGuestToken } from "@/lib/guestSession";

export type GuestProperty = {
  tinNumber: string;
  displayName: string;
  logoUrl?: string | null;
  hotelPhone?: string | null;
  hotelPhoneSecondary?: string | null;
};

export type GuestProfile = {
  firstName: string;
  lastName: string;
  phone: string;
  phoneSecondary: string;
  email: string;
  sex: string;
  isEthiopian: boolean;
  nationalId: string;
  passportNumber: string;
  country: string;
  stateRegion: string;
  addressLine: string;
};

export type GuestStay = {
  id: number;
  voucherCode: string;
  status: string;
  HotelName: string;
  arrivalAt: string;
  departureAt: string;
  expectedNights: number;
  expectedDepartureAt?: string | null;
  nights: number;
  adults: number;
  children: number;
  guest: GuestProfile;
  rooms: Array<{ id: number; roomNumber: string; roomType: string }>;
  bill: GuestBill | null;
  property: GuestProperty | null;
};

export type GuestBillLine = {
  id: number;
  kind: string;
  description: string;
  quantity: number;
  unitPriceETB: number;
  amountETB: number;
  roomNumber: string;
  fulfillmentStatus: string;
  fulfilledAt?: string | null;
  fulfilledBy?: string;
  createdAt: string;
};

export type GuestBill = {
  id: number;
  status: string;
  totalETB: number;
  lines: GuestBillLine[];
};

export type CafeMenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  type: string;
  imageUrl: string;
  isSuspended: boolean;
};

export type LaundryCatalogItem = {
  id: number;
  name: string;
  unitPriceETB: number;
  unitLabel: string;
  imageUrl: string;
  kind: string;
};

export type GuestComplaint = {
  id: number;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type GuestRating = {
  id: number;
  overall: number;
  cleanliness?: number | null;
  service?: number | null;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

const GUEST_PROFILE_FIELDS = `
  firstName lastName phone phoneSecondary email sex
  isEthiopian nationalId passportNumber country stateRegion addressLine
`;

const STAY_FIELDS = `
  id
  voucherCode
  status
  HotelName
  arrivalAt
  departureAt
  expectedNights
  expectedDepartureAt
  nights
  adults
  children
  guest { ${GUEST_PROFILE_FIELDS} }
  rooms { id roomNumber roomType }
  bill {
    id
    status
    totalETB
    lines {
      id
      kind
      description
      quantity
      unitPriceETB
      amountETB
      roomNumber
      fulfillmentStatus
      fulfilledAt
      fulfilledBy
      createdAt
    }
  }
  property { tinNumber displayName logoUrl hotelPhone hotelPhoneSecondary }
`;

const COMPLAINT_FIELDS = `
  id category message status createdAt updatedAt
`;

const RATING_FIELDS = `
  id overall cleanliness service comment createdAt updatedAt
`;

function authToken() {
  return readGuestToken();
}

export async function guestLogin(input: { otp: string }) {
  const data = await graphqlRequest<{
    guestLogin: { token: string; stay: GuestStay };
  }>(
    `mutation GuestLogin($otp: String!) {
      guestLogin(otp: $otp) {
        token
        stay { ${STAY_FIELDS} }
      }
    }`,
    input,
  );
  return data.guestLogin;
}

export async function fetchGuestMe() {
  const data = await graphqlRequest<{ guestMe: GuestStay }>(
    `query GuestMe { guestMe { ${STAY_FIELDS} } }`,
    undefined,
    authToken(),
  );
  return data.guestMe;
}

export async function fetchGuestRegistrationCard() {
  const data = await graphqlRequest<{ guestRegistrationCard: GuestStay }>(
    `query GuestRegistrationCard {
      guestRegistrationCard { ${STAY_FIELDS} }
    }`,
    undefined,
    authToken(),
  );
  return data.guestRegistrationCard;
}

export async function fetchGuestCafeMenu() {
  const data = await graphqlRequest<{ guestCafeMenu: CafeMenuItem[] }>(
    `query GuestCafeMenu {
      guestCafeMenu {
        id name price category type imageUrl isSuspended
      }
    }`,
    undefined,
    authToken(),
  );
  return data.guestCafeMenu;
}

export async function fetchGuestLaundryCatalog() {
  const data = await graphqlRequest<{
    guestLaundryCatalog: LaundryCatalogItem[];
  }>(
    `query GuestLaundryCatalog {
      guestLaundryCatalog {
        id name unitPriceETB unitLabel imageUrl kind
      }
    }`,
    undefined,
    authToken(),
  );
  return data.guestLaundryCatalog;
}

export async function fetchGuestBill() {
  const data = await graphqlRequest<{ guestBill: GuestBill }>(
    `query GuestBill {
      guestBill {
        id
        status
        totalETB
        lines {
          id kind description quantity unitPriceETB amountETB roomNumber
          fulfillmentStatus fulfilledAt fulfilledBy createdAt
        }
      }
    }`,
    undefined,
    authToken(),
  );
  return data.guestBill;
}

export async function guestUpdateOrderLine(input: {
  otp: string;
  lineId: number;
  quantity: number;
}) {
  const data = await graphqlRequest<{
    guestUpdateOrderLine: { stay: GuestStay; line: GuestBillLine };
  }>(
    `mutation GuestUpdateOrderLine($otp: String!, $lineId: Int!, $quantity: Float!) {
      guestUpdateOrderLine(otp: $otp, lineId: $lineId, quantity: $quantity) {
        line {
          id kind description quantity unitPriceETB amountETB roomNumber
          fulfillmentStatus fulfilledAt fulfilledBy createdAt
        }
        stay { ${STAY_FIELDS} }
      }
    }`,
    input,
    authToken(),
  );
  return data.guestUpdateOrderLine;
}

export async function guestCancelOrderLine(input: {
  otp: string;
  lineId: number;
}) {
  const data = await graphqlRequest<{
    guestCancelOrderLine: { stay: GuestStay; line: GuestBillLine };
  }>(
    `mutation GuestCancelOrderLine($otp: String!, $lineId: Int!) {
      guestCancelOrderLine(otp: $otp, lineId: $lineId) {
        line {
          id kind description quantity unitPriceETB amountETB roomNumber
          fulfillmentStatus fulfilledAt fulfilledBy createdAt
        }
        stay { ${STAY_FIELDS} }
      }
    }`,
    input,
    authToken(),
  );
  return data.guestCancelOrderLine;
}

export async function fetchGuestPropertyInfo(tinNumber: string) {
  const data = await graphqlRequest<{ guestPropertyInfo: GuestProperty }>(
    `query GuestProperty($tinNumber: String!) {
      guestPropertyInfo(tinNumber: $tinNumber) {
        tinNumber displayName logoUrl hotelPhone hotelPhoneSecondary
      }
    }`,
    { tinNumber },
  );
  return data.guestPropertyInfo;
}

export async function guestPlaceOrder(input: {
  otp: string;
  foodDrink?: Array<{ itemId: number; quantity: number }>;
  laundry?: Array<{ serviceItemId: number; quantity: number }>;
}) {
  const data = await graphqlRequest<{
    guestPlaceOrder: {
      stay: GuestStay;
      foodDrinkLinesCreated: number;
      laundryLinesCreated: number;
    };
  }>(
    `mutation GuestPlaceOrder(
      $otp: String!
      $foodDrink: [GuestFoodDrinkLineInput!]
      $laundry: [GuestLaundryLineInput!]
    ) {
      guestPlaceOrder(otp: $otp, foodDrink: $foodDrink, laundry: $laundry) {
        foodDrinkLinesCreated
        laundryLinesCreated
        stay { ${STAY_FIELDS} }
      }
    }`,
    input,
    authToken(),
  );
  return data.guestPlaceOrder;
}

export async function fetchGuestMyComplaints() {
  const data = await graphqlRequest<{ guestMyComplaints: GuestComplaint[] }>(
    `query GuestMyComplaints {
      guestMyComplaints { ${COMPLAINT_FIELDS} }
    }`,
    undefined,
    authToken(),
  );
  return data.guestMyComplaints;
}

export async function guestSubmitComplaint(input: {
  category: string;
  message: string;
}) {
  const data = await graphqlRequest<{ guestSubmitComplaint: GuestComplaint }>(
    `mutation GuestSubmitComplaint($category: String!, $message: String!) {
      guestSubmitComplaint(category: $category, message: $message) {
        ${COMPLAINT_FIELDS}
      }
    }`,
    input,
    authToken(),
  );
  return data.guestSubmitComplaint;
}

export async function fetchGuestMyRating() {
  const data = await graphqlRequest<{ guestMyRating: GuestRating | null }>(
    `query GuestMyRating {
      guestMyRating { ${RATING_FIELDS} }
    }`,
    undefined,
    authToken(),
  );
  return data.guestMyRating;
}

export async function guestSubmitRating(input: {
  overall: number;
  cleanliness?: number | null;
  service?: number | null;
  comment?: string;
}) {
  const data = await graphqlRequest<{ guestSubmitRating: GuestRating }>(
    `mutation GuestSubmitRating(
      $overall: Int!
      $cleanliness: Int
      $service: Int
      $comment: String
    ) {
      guestSubmitRating(
        overall: $overall
        cleanliness: $cleanliness
        service: $service
        comment: $comment
      ) {
        ${RATING_FIELDS}
      }
    }`,
    input,
    authToken(),
  );
  return data.guestSubmitRating;
}
