import { prisma } from '../../db/client';
import { AppError } from '../../middleware/error-handler';
import { CreateCustomerInput, UpdateCustomerInput } from './customers.schema';

export async function createCustomer(tenantId: string, input: CreateCustomerInput) {
  const existing = await prisma.customer.findUnique({
    where: { tenantId_email: { tenantId, email: input.email } },
  });
  if (existing) throw new AppError(409, 'Customer with this email already exists');

  return prisma.customer.create({
    data: {
      tenantId,
      email: input.email,
      name: input.name,
      nombaCustomerId: input.nombaCustomerId,
    },
  });
}

export async function getCustomer(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } });
  if (!customer) throw new AppError(404, 'Customer not found');
  return customer;
}

export async function listCustomers(tenantId: string) {
  return prisma.customer.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
}

export async function updateCustomer(
  tenantId: string,
  customerId: string,
  input: UpdateCustomerInput
) {
  await getCustomer(tenantId, customerId);
  return prisma.customer.update({ where: { id: customerId }, data: input });
}

export async function deleteCustomer(tenantId: string, customerId: string) {
  await getCustomer(tenantId, customerId);
  return prisma.customer.delete({ where: { id: customerId } });
}
