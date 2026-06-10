class MediaItemStats
  def initialize(scope)
    @scope = scope
  end

  def total
    @total ||= @scope.count
  end

  def count(status)
    counts.fetch(status.to_s, 0)
  end

  def percentage(status)
    return 0 if total.zero?

    ((count(status).to_f / total) * 100).round
  end

  private

  def counts
    @counts ||= @scope.group(:status).count
  end
end
