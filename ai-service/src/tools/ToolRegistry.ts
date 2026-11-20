import { ToolDefinition, ToolExecutionResult } from '../types/index.js';
import { ShoppingTools } from './ShoppingTools.js';
import { BackendAuthContext } from './NodeBackendClient.js';

export class ToolRegistry {
  private readonly shoppingTools: ShoppingTools;
  private readonly toolAllowlist: Set<string>;
  private readonly executionLimit = 5;

  constructor(shoppingTools: ShoppingTools) {
    this.shoppingTools = shoppingTools;
    const defs = shoppingTools.getDefinitions();
    this.toolAllowlist = new Set([
      ...defs.map((d) => d.name),
      // Also allow snake_case equivalents
      'search_products',
      'get_product_details',
      'get_product_variants',
      'check_stock',
      'add_to_cart',
      'update_cart',
      'remove_from_cart',
      'get_wishlist',
      'add_to_wishlist',
      'validate_voucher',
      'apply_voucher',
      'get_my_orders',
      'prepare_checkout',
      'confirm_order',
      'get_loyalty_status',
      'get_my_profile',
      'update_allowed_profile_fields',
      'search_published_policies',
      'search_knowledge_base',
      'start_checkout',
      'cancel_checkout',
      'get_my_cart',
      'check_order_status',
      'get_vouchers',
      'get_categories',
    ]);
  }

  public getDefinitions(): ToolDefinition[] {
    return this.shoppingTools.getDefinitions();
  }

  public isToolAllowed(name: string): boolean {
    return this.toolAllowlist.has(name);
  }

  public async executeTool(
    name: string,
    args: Record<string, unknown>,
    authContext: BackendAuthContext
  ): Promise<ToolExecutionResult> {
    if (!this.isToolAllowed(name)) {
      return {
        success: false,
        code: 'TOOL_NOT_ALLOWED',
        message: `Công cụ '${name}' không nằm trong danh sách cho phép (Tool Allowlist).`,
      };
    }

    return this.shoppingTools.execute(name, args, authContext);
  }
}
